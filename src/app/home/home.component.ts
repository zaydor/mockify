import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { child, get, getDatabase, ref, update } from 'firebase/database';
import { CookieService } from 'ngx-cookie-service';
import { __clientID__, __clientSecret__, __redirectURI__, __spotifyScope__ } from '../secrets';
import { RealtimeDatabaseService } from '../services/realtime-database.service';
import { UserCookieService } from '../services/user-cookie.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  private _realtimeDatabase: RealtimeDatabaseService = new RealtimeDatabaseService(this.database);
  public myAuth;
  private clientId: string = __clientID__;
  private clientSecret: string = __clientSecret__;
  public accessToken: string;
  private _userCookieService: UserCookieService = new UserCookieService(this.cookieService);

  public isSpotifyConnected: boolean = false;
  public isDoneLoading: boolean = false;

  constructor(private auth: AngularFireAuth, private database: AngularFireDatabase, private cookieService: CookieService) {
    this.myAuth = getAuth();
    console.log(this.myAuth.currentUser);
    this.auth.onAuthStateChanged(async (user) => {
      if (user !== null) {
        const dbRef = await ref(getDatabase());

        await get(child(dbRef, `users/${user.uid}/token`)).then((snapshot) => {
          if (snapshot.exists() && snapshot.val() !== '') { // we assume spotify has been connected here since we have a refresh token
            this.isSpotifyConnected = true;
            this.isDoneLoading = true;
          }

          console.log(this.isSpotifyConnected);
        });
        console.log(user.uid);
      } else {
        console.log('user is null');
        this.isDoneLoading = true;
      }
    }).catch((e) => {
      console.log('test');
      console.log('test');
    });
    // this._realtimeDatabase.setDatabase('users', user.uid, data); // we cam store spotify refresh token like this
    // this.auth.currentUser.then((val) => {
    //   console.log(val.email);
    // });
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

}
