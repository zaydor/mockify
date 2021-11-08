/// <reference types="@types/spotify-web-playback-sdk" />
import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { child, get, getDatabase, ref, set, update } from 'firebase/database';
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

  /*
  
  ------------------------ PROFILE PAGE FUNCTIONS ------------------------
  
  */

  constructor(private route: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private database: AngularFireDatabase, private dialog: MatDialog, private spotifyApiService: SpotifyApiService) {
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

            this.access_token = await this.refreshAccessToken(this.refresh_token);

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

  expandPlayer(isExpanded) {
    const playerbox = document.getElementById('player-box');
    console.log(isExpanded);
    // (isExpanded) ? playerbox.style.minHeight = '100%' : playerbox.style.minHeight = '10%';
  }



  openPlaylistDialog(event, index) {
    if (this.isDialogOpen) return;

    const targetId = (event.target as HTMLElement).attributes.getNamedItem('id').textContent;
    if (targetId.startsWith('middle')) return;

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

  uploadPlaylistToFrontPage(index) {
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
  }

  removePlaylistFromFrontPage(index) {
    // remove from database
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
    (this.isSongPlaying) ? this.pauseSong() : this.playSong();

    this.isSongPlaying = !this.isSongPlaying;
  }

  async setRepeatMode() {
    if (this.repeatingIndex === 2) {
      this.repeatingIndex = 0;
    } else {
      this.repeatingIndex++;
    }

    await this.spotifyApiService.setRepeatMode(this.access_token, this.repeatingIndex);
  }

  async getCurrentSongInfo() {
    const data = await this.spotifyApiService.getCurrentSongInfo(this.access_token);

    this.currentSongId = data.songID;

    this.currentSongPlaying = data.songName;

    this.songURL = data.image.url;

    this.artistName = data.artists[0].name;
  }


  async playSong() {
    (this.isPlayerSetUp) ? await this.spotifyApiService.playSong(this.access_token, this.playerId) :
      await this.spotifyApiService.playSong(this.access_token);

    this.getCurrentSongInfo();

    this.isSongPlaying = true;
  }

  async pauseSong() {
    await this.spotifyApiService.pauseSong(this.access_token);

    this.isSongPlaying = false;
  }

  async nextSongAction() {
    await this.spotifyApiService.nextSong(this.access_token).then(() => {
      this.getCurrentSongInfo();
    });
  }

  async previousSongAction() {
    await this.spotifyApiService.previousSong(this.access_token).then(() => {
      this.getCurrentSongInfo();
    });
  }

  async shuffleMusic() {
    this.isShuffling = !this.isShuffling;

    await this.spotifyApiService.shuffleMusic(this.access_token, this.isShuffling);
  }

  async getCurrentSongName() {
    this.currentSongPlaying = await this.spotifyApiService.getCurrentSongName(this.access_token);
    console.log(this.currentSongPlaying);
  }

  async setUpProfilePage() {
    await this.getSpotifyUserInfo();
    this.userPlaylists = [];
    await this.getSpotifyUserPlaylists();
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
    await this.spotifyApiService.refreshAccessToken(this.refresh_token).then(async (token) => {
      const player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
      });

      await player.connect().then(async (success: boolean) => {
        if (success) {
          console.log("The Web Playback SDK successfully connected to spotify!");
        }
      });

      player.addListener('ready', async ({ device_id }) => {
        console.log("The Web Playback SDK is ready to play music!");
        this.isPlayerSetUp = true;
        this.playerId = device_id;
        console.log('device id: ' + this.playerId);

        await this.spotifyApiService.transferPlayback(this.access_token, this.playerId);
      });

      player.addListener('player_state_changed', async ({
        position,
        duration,
        track_window: { current_track }
      }) => {
        console.log('Currently Playing', current_track);
        console.log('Position in Song', position);
        console.log('Duration of Song', duration);

        if (current_track.id !== this.currentSongId) {
          await this.getCurrentSongInfo().then(() => {
          });
        }
      });
    });



  }

}
