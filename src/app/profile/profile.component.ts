/// <reference types="@types/spotify-web-playback-sdk" />
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { child, get, getDatabase, onValue, ref, remove, set, update } from 'firebase/database';
import { PlayerService } from '../player.service';
import { PlaylistInfoDialogComponent } from '../playlist-info-dialog/playlist-info-dialog.component';
import { __clientID__, __clientSecret__, __geniusAccessToken__, __redirectURI__ } from '../secrets';
import { SpotifyApiService } from '../services/spotify-api.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  public access_token: string | void = '';
  private refresh_token: string;
  private uid: string;
  private displayName: string;
  private isDialogOpen: boolean = false;
  public songURL: string;
  public artistName: string;

  public spotifyUser: {
    display_name: string,
    id: string,
    followers: number,
    profile_picture_URL: string,
  };

  public userPlaylists: {
    collaborative: boolean,
    description: string,
    id: string,
    name: string,
    tracksURL: string,
    image: any,
    tracksTotal: number
  }[];

  currentSongId = '';
  currentSongPlaying = 'test';
  isSongPlaying: boolean = false;
  isShuffling: boolean = false;
  repeatingIndex = 0;

  playerId;
  isPlayerSetUp: boolean = false;

  usersUploadedPlaylists = [];

  /*
  
  ------------------------ PROFILE PAGE FUNCTIONS ------------------------
  
  */

  constructor(private route: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private database: AngularFireDatabase, private dialog: MatDialog, private spotifyApiService: SpotifyApiService, private _snackBar: MatSnackBar, public player?: PlayerService) {
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user !== null) {
        console.log(user.uid);

        // TODO: check to see if refresh token exists in database
        this.uid = user.uid;
        this.displayName = user.displayName;
        const dbRef = ref(getDatabase());

        await get(child(dbRef, `users/${user.uid}/token`)).then(async (snapshot) => {
          if (snapshot.exists() && snapshot.val() !== '') { // refresh token exists
            console.log('snapshot val: ' + snapshot.val());
            this.refresh_token = snapshot.val();
            this.player.refresh_token = this.refresh_token;

            this.access_token = await this.refreshAccessToken(this.refresh_token);
            this.player.access_token = this.access_token;

            this.setUpProfilePage();

          } else { // refresh token does not exist
            if (this.route.snapshot.firstChild === null) { // TODO: if it does not exist and firstChild is not valid, go back to home
              console.log('error with url');
              this.router.navigate(['/home']);
            } else {
              const code = this.route.snapshot.firstChild.url[0].path;
              console.log(code);

              await this.getAccessToken(code, user.uid); // gets access token and stores refresh token in db
              // now that we have a refresh token in db, we can use it to get a new access token (stored in memory) and use the api
              // 1) navigate to /profile
              this.router.navigate(['/profile']);
            }
          }

          // 2) check if refresh token exists
          // 3) generate a new access token
          // 4) load up the rest of the profile page with spotify stuff


        })
      }
    });
  }
  isPublished(index) {
    if (this.usersUploadedPlaylists[0]) {
      if (this.usersUploadedPlaylists[0].includes(this.userPlaylists[index].id)) {
        return 'remove_circle_outline';
      }
    }

    return 'publish';
  }

  openPlaylistDialog(event, index) {
    if (this.isDialogOpen) return;

    const targetId = (event.target as HTMLElement).attributes.getNamedItem('id').textContent;
    if (targetId.startsWith('middle') || targetId.startsWith('left') || targetId.startsWith('right')) return;

    this.isDialogOpen = true;

    const cursorElements = document.getElementsByClassName('playlist-box');

    for (let i = 0; i < cursorElements.length; i++) {
      (cursorElements[i] as HTMLElement).style.cursor = 'default';
    }

    document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
    //document.getElementById('profile').style.opacity = '0.5';
    // when clicking on a playlist, I want a dialog to open that will show the playlist and all of its tracks
    const dialogRef = this.dialog.open(PlaylistInfoDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      maxHeight: '80%',
      position: { top: '0px', left: '0px' },
      data: [this.userPlaylists[index], this.access_token]
    });

    dialogRef.componentInstance.songPlaying.subscribe(async (uris) => {
      this.isSongPlaying = true;
      (this.isPlayerSetUp) ?
        await this.spotifyApiService.playSongsFromPlaylist(this.access_token, uris, this.playerId) :
        await this.spotifyApiService.playSongsFromPlaylist(this.access_token, uris);

      // await this.getCurrentSongInfo().then();
    });

    dialogRef.afterClosed().subscribe(() => {
      this.isDialogOpen = false;

      for (let i = 0; i < cursorElements.length; i++) {
        (cursorElements[i] as HTMLElement).style.cursor = 'pointer';
      }

      document.getElementsByTagName('html')[0].style.overflowY = 'auto';
      //document.getElementById('profile').style.opacity = '1';
    });


  }

  async getTracks(tracksURL, offset?, oldUris?) {
    if (!offset) offset = 0;

    let uris = [];
    if (oldUris) uris = oldUris;

    const data = await this.spotifyApiService.getTracks(this.access_token, tracksURL, offset);
    for (let i = 0; i < 100; i++) {
      if (!data.items[i]) break;

      const song = data.items[i].track;

      const artists = [];
      for (let j = 0; j < song.artists.length; j++) {
        artists.push(song.artists[j].name);
      }

      uris.push(
        song.uri
      );

    }

    if (!offset) offset = 0;

    const newOffset = 100 + offset;
    console.log(newOffset);
    console.log(data.total);
    if (newOffset < data.total) {
      this.getTracks(tracksURL, newOffset);
    }

    return uris;

  }

  async quickPlayPlaylist(index) {
    // get tracks, get URIS, play uris
    await this.getTracks(this.userPlaylists[index].tracksURL).then(async (uris) => {
      (this.isPlayerSetUp) ?
        await this.spotifyApiService.playSongsFromPlaylist(this.access_token, uris, this.playerId) :
        await this.spotifyApiService.playSongsFromPlaylist(this.access_token, uris);

      await this.getCurrentSongInfo();
      this.isSongPlaying = true;
    });


  }

  uploadPlaylistToFrontPage(index) {
    if (this.usersUploadedPlaylists[0]) {
      if (this.usersUploadedPlaylists[0].includes(this.userPlaylists[index].id)) {
        this.removePlaylistFromFrontPage(this.userPlaylists[index].id);
        this.openSnackBar(`${this.userPlaylists[index].name} has been removed from the front page!`);
        return;
      }
    }

    const playlistToUpload = {
      id: this.userPlaylists[index].id,
      name: this.userPlaylists[index].name,
      description: this.userPlaylists[index].description,
      image: this.userPlaylists[index].image,
      tracksURL: this.userPlaylists[index].tracksURL,
      tracksTotal: this.userPlaylists[index].tracksTotal,
      spotifyDisplayName: this.spotifyUser.display_name,
      spotifyId: this.spotifyUser.id,
      displayName: this.displayName,
      uid: this.uid
    };

    set(ref(getDatabase(), `frontpage-playlists/${this.uid}/${playlistToUpload.id}`), playlistToUpload);
    this.openSnackBar(`${this.userPlaylists[index].name} has been added to the front page!`);
  }

  removePlaylistFromFrontPage(playlistId) {
    remove(ref(getDatabase(), `frontpage-playlists/${this.uid}/${playlistId}`));
  }

  openSnackBar(message) {
    this._snackBar.open(message, 'close', {
      duration: 3000
    });
  }

  /*

  ------------------------ END PROFILE PAGE FUNCTIONS ------------------------

  */


  /*

  ------------------------ SPOTIFY API CALLS ------------------------

  */
  async refreshAccessToken(refresh_token) {
    return await this.spotifyApiService.refreshAccessToken(refresh_token);
  }

  async getAccessToken(code, uid): Promise<string | void> {
    const data = await this.spotifyApiService.getAccessToken(code);

    const updates = {};
    updates[`users/${uid}/token`] = data.refresh_token;

    update(ref(getDatabase()), updates);

    return data.access_token;
  }

  playPauseAction() {
    this.player.playPauseAction();
  }

  async setRepeatMode() {
    this.player.setRepeatMode();
  }

  async getCurrentSongInfo() {
    this.player.getCurrentSongInfo();
  }


  async playSong() {
    this.player.playSong();
  }

  async pauseSong() {
    this.player.pauseSong();
  }

  async nextSongAction() {
    this.player.nextSongAction();
  }

  async previousSongAction() {
    this.player.previousSongAction();
  }

  async shuffleMusic() {
    this.player.shuffleMusic();
  }

  async setUpProfilePage() {
    await this.getSpotifyUserInfo();
    this.userPlaylists = [];
    await this.getSpotifyUserPlaylists().then(() => {
      const testCountRef = ref(getDatabase(), `frontpage-playlists/${this.uid}`);
      onValue(testCountRef, (snapshot) => {
        this.usersUploadedPlaylists = [];
        if (!snapshot.exists()) return;
        const data = snapshot.val();
        console.log(Object.keys(data));
        this.usersUploadedPlaylists.push(Object.keys(data));
        return data;
      });
    });
  }

  async getSpotifyUserInfo() {
    this.spotifyUser = await this.spotifyApiService.getSpotifyUserInfo(this.access_token);
  }

  async getSpotifyUserPlaylists(offset?) {
    if (!offset) {
      offset = 0;
    }

    const data = await this.spotifyApiService.getSpotifyUserPlaylists(this.access_token, this.spotifyUser.id, offset);

    for (let i = 0; i < 50; i++) {
      const item = data.items[i];

      if (!item) break;
      if (item.owner.id !== this.spotifyUser.id) continue;

      this.userPlaylists.push({
        id: item.id,
        name: item.name,
        collaborative: item.collaborative,
        description: item.description,
        image: item.images[0],
        tracksURL: item.tracks.href,
        tracksTotal: item.tracks.total
      })
    }
    if (!offset) offset = 0;

    const newOffset = 50 + offset;
    if (newOffset < data.total) {
      this.getSpotifyUserPlaylists(newOffset);
    } else {
      this.userPlaylists.pop(); // remove 'liked songs' playlist
      console.log(this.userPlaylists);
    }
  }

  /*

  ------------------------ END SPOTIFY API CALLS ------------------------

  */

  async setUpPlayer() {
    this.player.setUpPlayer();
  }

}
