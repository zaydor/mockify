import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog } from '@angular/material/dialog';
import { getAuth, signOut } from 'firebase/auth';
import { child, get, getDatabase, ref, update } from 'firebase/database';
import { PlaylistInfoDialogComponent } from '../playlist-info-dialog/playlist-info-dialog.component';
import { __clientID__, __clientSecret__, __redirectURI__, __spotifyScope__ } from '../secrets';
import { RealtimeDatabaseService } from '../services/realtime-database.service';
import { SpotifyApiService } from '../services/spotify-api.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {


  // TODO: BUG: clicking text in playlist box does not open playlist dialog
  // TODO: BUG: playing a song while shuffling does not play the correct song


  // TODO: set up player on home page
  // TODO: build a full 'page' player && set up genius api with lyrics
  // DONE - clean up api calls
  // TODO: change icon if user playlist is already uploaded to front page
  // TODO: add a easy access button to play a playlist
  // TODO: make the app pretty
  // TODO: comments, readme, deploy

  private _realtimeDatabase: RealtimeDatabaseService = new RealtimeDatabaseService(this.database);
  public myAuth;
  private clientId: string = __clientID__;

  public isSpotifyConnected: boolean = false;
  public isDoneLoading: boolean = false;

  private refresh_token: string;
  private access_token: string;

  public frontPagePlaylists: {
    description: string,
    id: string,
    name: string,
    tracksURL: string,
    image: any,
    tracksTotal: number,
    spotifyDisplayName: string,
    spotifyId: string,
    displayName: string,
    uid: string

  }[];

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

  public followedPlaylistIndexes = [];

  public isDialogOpen: boolean = false;

  // MatPaginator Inputs
  public frontPagePlaylistLength = 0;
  pageSize = 10;

  shownFrontPagePlaylists = [];

  /*

  ------------------------ HOME PAGE FUNCTIONS ------------------------

 */

  constructor(private auth: AngularFireAuth, private database: AngularFireDatabase, private dialog: MatDialog, private spotifyApiService: SpotifyApiService) {
    this.myAuth = getAuth();
    console.log(this.myAuth.currentUser);
    this.auth.onAuthStateChanged(async (user) => {
      const dbRef = ref(getDatabase());
      if (user !== null) {
        await get(child(dbRef, `users/${user.uid}/token`)).then(async (snapshot) => {
          if (snapshot.exists() && snapshot.val() !== '') { // we assume spotify has been connected here since we have a refresh token
            this.isSpotifyConnected = true;
            this.isDoneLoading = true;
            this.refresh_token = snapshot.val();

            this.setUp()
          }

          console.log(this.isSpotifyConnected);
        });
        console.log(user.uid);
      } else {
        console.log('user is null');
        this.isDoneLoading = true;
      }
      this.frontPagePlaylists = [];
      this.getFrontPagePlaylists();

    }).catch((e) => {
      console.log('test');
    });
  }

  pageChange(event) {
    console.log(event);
    const currPageIndex = event.pageIndex;

    this.shownFrontPagePlaylists = [];

    const indexStart = currPageIndex * 10;
    let indexEnd = indexStart + 10;

    if (indexEnd > this.frontPagePlaylistLength) {
      indexEnd = this.frontPagePlaylistLength;
    }

    for (let i = indexStart; i < indexEnd; i++) {
      this.shownFrontPagePlaylists.push(this.frontPagePlaylists[i]);
    }
  }

  async setUp() {
    this.userPlaylists = [];
    this.access_token = await this.refreshAccessToken(this.refresh_token);
    await this.getSpotifyUserPlaylists().then(() => {
      this.setFollowedPlaylists();
    });

  }

  setFollowedPlaylists() {
    this.frontPagePlaylists.forEach((frontPagePlaylist, index) => {
      this.userPlaylists.forEach((userPlaylist) => {
        if (frontPagePlaylist.id === userPlaylist.id) {
          this.followedPlaylistIndexes.push(index);
        }
      });
    });
  }

  checkFollowed(index) {
    if (this.followedPlaylistIndexes.includes(index)) {
      return 'favorite';
    } else {
      return 'favorite_border';
    }
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
      data: [this.frontPagePlaylists[index], this.access_token]
    });

    dialogRef.componentInstance.songPlaying.subscribe(async () => {
      // this.isSongPlaying = true;
      // await this.getCurrentSongName();
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

  async getFrontPagePlaylists() {
    await get(child(ref(getDatabase()), `frontpage-playlists/`)).then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach((users) => {
          users.forEach((playlists) => {
            this.frontPagePlaylists.push(playlists.val());
          });
        });
      }
    }).then(() => {
      console.log(this.frontPagePlaylists);
      this.frontPagePlaylistLength = this.frontPagePlaylists.length;
      let indexEnd = 10;
      if (this.frontPagePlaylistLength < indexEnd) {
        indexEnd = this.frontPagePlaylistLength;
      }

      this.shownFrontPagePlaylists = [];
      for (let i = 0; i < indexEnd; i++) {
        this.shownFrontPagePlaylists.push(this.frontPagePlaylists[i]);
      }
    });


  }

  signAccountOut() {
    signOut(this.myAuth).then(() => {
      console.log('successfully signed out');
    })
      .catch((e) => {
        const errorcode = e.code;
        const errorMessage = e.message;
        console.log(errorMessage);
      });
  }

  generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text: string = '';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  async requestAccessToSpotify() {
    const redirectURI = __redirectURI__;
    const scope = __spotifyScope__;
    const state = this.generateRandomString(16);


    const updates = {};
    updates[`users/${this.myAuth.currentUser.uid}/token`] = '';
    updates[`users/${this.myAuth.currentUser.uid}/state`] = state;

    update(ref(getDatabase()), updates).then(() => {
      window.open('https://accounts.spotify.com/authorize?' + new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        state: state,
        redirect_uri: redirectURI,
        scope: scope
      }), '_blank');
    });

  }

  ngOnInit(): void {
  }

  /*

  ------------------------ END HOME PAGE FUNCTIONS ------------------------

  */

  /*

  ------------------------ SPOTIFY API CALLS ------------------------

  */

  async refreshAccessToken(refresh_token) {
    return await this.spotifyApiService.refreshAccessToken(refresh_token);
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

  async unfollowPlaylist(id) {
    await this.spotifyApiService.unfollowPlaylist(this.access_token, id);
  }

  async followPlaylist(index) {
    if (!this.isSpotifyConnected) {
      // TODO: prompt user to connect their spotify account if they want to follow a playlist
      return;
    }

    const id = this.frontPagePlaylists[index].id;

    if (this.followedPlaylistIndexes.includes(index)) {
      await this.unfollowPlaylist(id);
      return;
    }

    await this.spotifyApiService.followPlaylist(this.access_token, id);

  }

  /*

  ------------------------ END SPOTIFY API CALLS ------------------------

  */

}
