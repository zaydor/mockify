import { Component, Input, OnInit, Output } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { child, get, getDatabase, ref, set, update } from 'firebase/database';
import { PlaylistInfoDialogComponent } from '../playlist-info-dialog/playlist-info-dialog.component';
import { __clientID__, __clientSecret__, __redirectURI__ } from '../secrets';

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

  currentSongPlaying = 'test';
  isSongPlaying: boolean = false;
  isShuffling: boolean = false;
  repeatingState = ['off', 'context', 'track'];
  repeatingIndex = 0;

  constructor(private route: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private database: AngularFireDatabase, private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user !== null) {
        console.log(user.uid);

        // TODO: check to see if refresh token exists in database
        this.uid = user.uid;
        this.displayName = user.displayName;
        const dbRef = await ref(getDatabase());

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

  songIsPlaying() {
    console.log('song is playing');
  }

  playPauseAction() {
    if (this.isSongPlaying) {
      this.pauseSong();
    } else {
      this.playSong();
    }

    this.isSongPlaying = !this.isSongPlaying;
  }

  shufflingAction() {
    this.shuffleMusic();
  }


  async setRepeatMode() {
    if (this.repeatingIndex === 2) {
      this.repeatingIndex = 0;
    } else {
      this.repeatingIndex++;
    }

    const result = await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${this.repeatingState[this.repeatingIndex]}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });
  }


  async playSong() {
    const result = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });

    this.isSongPlaying = true;
  }

  async pauseSong() {
    const result = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });

    this.isSongPlaying = false;
  }

  async nextSongAction() {
    const result = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    }).then(() => {
      this.getCurrentSongName();
    });
  }

  async previousSongAction() {
    const result = await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    }).then(() => {
      this.getCurrentSongName();
    });
  }

  async shuffleMusic() {
    this.isShuffling = !this.isShuffling;

    const result = await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${this.isShuffling}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
      },
    })
  }

  async getCurrentSongName() {
    const result = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
      },
    });

    const data = await result.json();

    console.log(data);

    // this.songPlaying.emit();

    this.currentSongPlaying = data.item.name;
    console.log(this.currentSongPlaying);
  }

  async setUpProfilePage() {
    await this.getSpotifyUserInfo();
    this.userPlaylists = [];
    await this.getSpotifyUserPlaylists();
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

    dialogRef.componentInstance.songPlaying.subscribe(async () => {
      this.isSongPlaying = true;
      await this.getCurrentSongName();
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

  async getSpotifyUserInfo() {
    const result = await fetch('https://api.spotify.com/v1/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token
      }
    });

    const data = await result.json();

    // console.log(data);

    this.spotifyUser = {
      display_name: await data.display_name,
      id: await data.id,
      profile_picture_URL: await data.images[0].url,
      followers: await data.followers.total
    }

    // console.log(this.spotifyUser);
  }

  async getSpotifyUserPlaylists(offset?) {
    // const result = await fetch('https://api.spotify.com/v1/me/playlists?' + new URLSearchParams({
    //   limit: '50',
    //   offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    // }), {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer ' + this.access_token,
    //   }
    // });
    // console.log('test');
    const id = this.spotifyUser.id;
    const result = await fetch(`https://api.spotify.com/v1/users/${id}/playlists?` + new URLSearchParams({
      limit: '50',
      offset: (offset) ? offset : '0' // if offset exists, put in an offset, otherwise make it 0
    }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.access_token,
      }
    });

    const data = await result.json();

    // console.log(data);

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
      this.userPlaylists.pop();
      console.log(this.userPlaylists);
    }
    // store user playlists in an array
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

  async refreshAccessToken(refresh_token) {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(__clientID__ + ':' + __clientSecret__),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}`
    });

    const data = await result.json();

    console.log('new access token: ' + data.access_token);

    return data.access_token;

    // we have a new access token to use now
  }

  async getAccessToken(code, uid): Promise<string | void> {
    await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(__clientID__ + ':' + __clientSecret__)
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${__redirectURI__}`
    }).then(async (result) => {
      const data = await result.json();

      console.log(data);

      const updates = {};
      updates[`users/${uid}/token`] = data.refresh_token;

      update(ref(getDatabase()), updates);


      return data.access_token;
    });


  }

}
