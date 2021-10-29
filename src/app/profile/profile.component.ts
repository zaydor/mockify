import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { child, get, getDatabase, ref, update } from 'firebase/database';
import { PlaylistInfoDialogComponent } from '../playlist-info-dialog/playlist-info-dialog.component';
import { __clientID__, __clientSecret__, __redirectURI__ } from '../secrets';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  private access_token: string | void;
  private refresh_token: string;
  private uid: string;

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
  }[]/* = [{
    "id": "5hsMdpSVxLht4uiluWuqSX",
    "name": "Car Trip With Grandparents",
    "collaborative": false,
    "description": "",
    "image": {
      "height": 640,
      "url": "https://mosaic.scdn.co/640/ab67616d0000b2735398a024ab2c2081820654a8ab67616d0000b273a496dc8c33ca6d10668b3157ab67616d0000b273af82af61a16d677bf22f37a1ab67616d0000b273bde8dfd1922129f3d9e3732f",
      "width": 640
    },
    "tracksURL": "https://api.spotify.com/v1/playlists/5hsMdpSVxLht4uiluWuqSX/tracks",
    "tracksTotal": 50
  }]*/;

  constructor(private route: ActivatedRoute, private router: Router, private auth: AngularFireAuth, private database: AngularFireDatabase, private dialog: MatDialog) {
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(async (user) => {
      if (user !== null) {
        console.log(user.uid);

        // TODO: check to see if refresh token exists in database
        this.uid = user.uid;
        const dbRef = await ref(getDatabase());

        get(child(dbRef, `users/${user.uid}/token`)).then(async (snapshot) => {
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

  async setUpProfilePage() {
    await this.getSpotifyUserInfo();
    this.userPlaylists = [];
    await this.getSpotifyUserPlaylists();
  }

  openPlaylistDialog(index) {
    document.getElementsByTagName('html')[0].style.overflowY = 'hidden';
    document.getElementById('profile').style.opacity = '0.5';
    // when clicking on a playlist, I want a dialog to open that will show the playlist and all of its tracks
    const dialogRef = this.dialog.open(PlaylistInfoDialogComponent, {
      width: '100%',
      maxWidth: '100%',
      maxHeight: '80%',
      position: { top: '0px', left: '0px' },
      data: [this.userPlaylists[index], this.access_token]
    });

    dialogRef.afterClosed().subscribe(() => {
      document.getElementsByTagName('html')[0].style.overflowY = 'auto';
      document.getElementById('profile').style.opacity = '1';
    })


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
