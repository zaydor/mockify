import { Component, OnInit } from '@angular/core';
import { UserCookieService } from '../services/user-cookie.service';
import { CookieService } from 'ngx-cookie-service';
import { __clientID__, __clientSecret__, __redirectURI__, __spotifyScope__ } from '../secrets';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { RealtimeDatabaseService } from '../services/realtime-database.service';


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

  constructor(private cookieService: CookieService, private database: AngularFireDatabase) {
    this.readDatabase();
  }

  ngOnInit(): void {
  }

  setDatabase() {
    this._realtimeDatabase.setDatabase();
  }

  readDatabase() {
    this._realtimeDatabase.readDatabase();
  }

  updateDatabase() {
    this._realtimeDatabase.updateDatabase();

  }

  deleteDatabase() {
    this._realtimeDatabase.deleteDatabase();
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
