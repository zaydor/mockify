import { Component, OnInit } from '@angular/core';
import { UserCookieService } from '../services/user-cookie.service';
import { CookieService } from 'ngx-cookie-service';
import { __clientID__, __clientSecret__, __redirectURI__, __spotifyScope__ } from '../secrets';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { RealtimeDatabaseService } from '../services/realtime-database.service';
import { User } from '../user';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  private clientId: string = __clientID__;
  private clientSecret: string = __clientSecret__;
  public accessToken: string;
  private _userCookieService: UserCookieService = new UserCookieService(this.cookieService);
  private _realtimeDatabase: RealtimeDatabaseService = new RealtimeDatabaseService(this.database);
  public form: User = new User('', '', '', '');

  public myAuth;

  constructor(public dialog: MatDialog, private cookieService: CookieService, private database: AngularFireDatabase, private auth: AngularFireAuth, private router: Router) {
    this.readDatabase();

    this.myAuth = getAuth();
  }

  ngOnInit(): void {
  }

  async createNewForm() {
    console.log(this.form);

    const data = {
      email: this.form.email,
      password: this.form.password
    };

    createUserWithEmailAndPassword(this.myAuth, this.form.email, this.form.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('user: ' + user);
        console.log('successfully created account');
        this.router.navigate(['/home']);
      })
      .catch((e) => {
        const errorcode = e.code;
        const errorMessage = e.message;
        console.log(errorMessage);
      });

  }

  signAccountIn() {
    document.getElementById('input-error').style.visibility = 'hidden';
    signInWithEmailAndPassword(this.myAuth, this.form.email, this.form.password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log('successfully signed in');
        this.router.navigate(['/home']);
      })
      .catch((e) => {
        const errorcode = e.code;
        const errorMessage = e.message;
        console.log(errorMessage);
        document.getElementById('input-error').style.visibility = 'visible';
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


  setDatabase(tableName: string, id, data?) {
    const table1 = 'lastUserIdIndex/';
    const id0 = 0; // get last user index
    const _tableName = tableName;
    const _id = id;

    const data0 = {
      username: 'jane',
      refresh_token: '987'
    };
    const data1 = {
      index: 0
    };

    this._realtimeDatabase.setDatabase(_tableName, _id, data);
  }

  readDatabase() {
    const tableName = 'lastUserIdIndex/';
    const id = 0; // get last user index
    this._realtimeDatabase.readDatabase(tableName, id);
  }

  updateDatabase() {
    const tableName = 'lastUserIdIndex/';
    const id = 0; // get last user index
    const data = {
      username: 'jane',
      refresh_token: '987'
    };
    this._realtimeDatabase.updateDatabase(tableName, id, data);

  }

  deleteDatabase() {
    const tableName = 'lastUserIdIndex/';
    const id = 0; // get last user index
    this._realtimeDatabase.deleteDatabase(tableName, id);
  }

  printCookies() {
    console.log(this._userCookieService.getAll());
  }

  deleteAllCookies() {
    this._userCookieService.deleteAll();
  }

  generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text: string = '';

    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  async requestAccess() {
    const redirectURI = __redirectURI__;
    const scope = __spotifyScope__;
    const state = this.generateRandomString(16);

    this._userCookieService.setCookie('state', state);

    window.open('https://accounts.spotify.com/authorize?' + new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      state: state,
      redirect_uri: redirectURI,
      scope: scope
    }), '_blank');
  }

  getGET(token: string) {
    return {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token }
    }
  }

  async getToken(): Promise<string> {
    const result = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(this.clientId + ':' + this.clientSecret)
      },
      body: 'grant_type=client_credentials'
    });

    const data = await result.json();

    this.accessToken = data.access_token;

    return data.access_token;
  }

  async getGenres(): Promise<object> {
    const result = await fetch('https://api.spotify.com/v1/browse/categories?locale=sv_US', this.getGET(this.accessToken));

    const data = await result.json();
    console.log(data.categories);
    console.log(typeof data.categories.items);

    return data.categories.items;

  }

  async getPlaylistByGenre(token: string, genreId: string): Promise<object> {
    const limit = 10;

    const result = await fetch(`https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}`, this.getGET(this.accessToken));

    const data: any = result.json();

    console.log(data);
    console.log(typeof data.items);

    return data.items;
  }

  async getTracks(token: string, tracksEndPoint) {
    const limit = 10;

    const result = await fetch(`${tracksEndPoint}?limit=${limit}`, this.getGET(this.accessToken));

    const data = await result.json();
    return data;
  }

  async getTrack(token, trackEndPoint) {
    const result = await fetch(`${trackEndPoint}`, this.getGET(this.accessToken));

    const data = await result.json();

    return data;
  }

}
