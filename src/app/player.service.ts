import { Injectable } from '@angular/core';
import { SpotifyApiService } from './services/spotify-api.service';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  isPlayerSetUp: boolean = false;

  playerId;

  isSongPlaying: boolean = false;

  currentSongId = '';

  songURL: string;

  artistName: string;

  isShuffling: boolean = false;

  currentSongPlaying = 'test';

  repeatingIndex = 0;

  access_token;

  refresh_token;

  constructor(private spotifyApiService: SpotifyApiService) { }

  async playPauseAction() {
    (this.isSongPlaying) ? this.pauseSong() : this.playSong();

    this.isSongPlaying = !this.isSongPlaying;
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
      this.isSongPlaying = true;
    });
  }

  async previousSongAction() {
    await this.spotifyApiService.previousSong(this.access_token).then(() => {
      this.getCurrentSongInfo();
      this.isSongPlaying = true;
    });
  }

  async shuffleMusic() {
    this.isShuffling = !this.isShuffling;

    await this.spotifyApiService.shuffleMusic(this.access_token, this.isShuffling);
  }

  async setRepeatMode() {
    if (this.repeatingIndex === 2) {
      this.repeatingIndex = 0;
    } else {
      this.repeatingIndex++;
    }

    await this.spotifyApiService.setRepeatMode(this.access_token, this.repeatingIndex);
  }

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

  async getCurrentSongInfo() {
    const data = await this.spotifyApiService.getCurrentSongInfo(this.access_token);
    if (!data) return;

    this.currentSongId = data.songID;

    this.currentSongPlaying = data.songName;

    this.songURL = data.image.url;

    this.artistName = data.artists[0].name;
  }
}