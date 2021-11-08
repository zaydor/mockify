/// <reference types="@types/spotify-web-playback-sdk" />

import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { __geniusAccessToken__ } from '../secrets';
import { getLyrics } from 'genius-lyrics-api';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css'],
  animations: [
    trigger("grow", [
      state('minimized', style({
        height: '*'
      })),
      state('expanded', style({
        height: '90vh'
      })),
      transition('minimized => expanded', animate('400ms ease-in-out')),
      transition('expanded => minimized', animate('400ms ease-in-out'))
    ])
  ]
})
export class PlayerComponent implements OnInit {
  isExpanded: boolean = false;
  playerState: string = 'minimized'; // or 'expanded'

  isPlayingMusic: boolean = false;
  currentSongName: string = '';
  access_token = '';

  geniusOptions = {
    apiKey: __geniusAccessToken__,
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    optimizeQuery: true
  };

  @Input()
  songName: string;

  @Input()
  songURL: string;

  @Input()
  artistName: string;

  @Input()
  isSongPlaying: boolean;

  @Input()
  isShuffling: boolean;

  @Input()
  repeatingIndex: number;

  @Input()
  playerId;

  @Input()
  isPlayerSetUp: boolean;

  isAnimationFinished: boolean = true;

  @Output()
  playPauseAction = new EventEmitter();

  @Output()
  nextSongAction = new EventEmitter();

  @Output()
  previousSongAction = new EventEmitter();

  @Output()
  shufflingAction = new EventEmitter();

  @Output()
  repeatingAction = new EventEmitter();

  @Output()
  expandAction = new EventEmitter();

  @Output()
  setUpPlayerAction = new EventEmitter();

  currentSongLyrics: string;

  isLyricView: boolean = false;
  isLyricsLoaded: boolean = false;



  constructor() {
    this.waitForSpotifyWebPlaybackSDKToLoad();
  }

  ngOnInit(): void {
  }

  public waitForSpotifyWebPlaybackSDKToLoad(): Promise<typeof Spotify> {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    window.onSpotifyWebPlaybackSDKReady = () => { };

    return new Promise((resolve) => {
      if (window.Spotify) {
        resolve(window.Spotify);
      } else {
        window.onSpotifyWebPlaybackSDKReady = () => {
          resolve(window.Spotify);
        };
      }
    });
  }

  async setUpPlayer() {
    this.setUpPlayerAction.emit();
  }

  async expandPlayer() {
    this.isAnimationFinished = false;
    this.isExpanded = !this.isExpanded;
    (this.isExpanded) ? this.playerState = 'expanded' : this.playerState = 'minimized';
    await setTimeout(() => {
      this.isAnimationFinished = true;
    }, 300)
  }

  playPausePress() {
    this.playPauseAction.emit();
  }

  nextSongPress() {
    this.isLyricView = false;
    this.isLyricsLoaded = false;
    this.nextSongAction.emit();
  }

  previousSongPress() {
    this.isLyricView = false;
    this.isLyricsLoaded = false;
    this.previousSongAction.emit();
  }

  shufflingPress() {
    this.shufflingAction.emit();
  }

  shufflingState() {
    if (this.isShuffling) {
      return "Shuffling"
    } else {
      return "Shuffle"
    }
  }

  repeatingPress() {
    this.repeatingAction.emit();
  }

  repeatingState() {
    if (this.repeatingIndex === 0) {
      return 'No Repeating';
    } else if (this.repeatingIndex === 1) {
      return 'Repeating Context';
    } else {
      return 'Repeating Song';
    }
  }

  isPlaying() {
    if (this.isSongPlaying) {
      return "Pause"
    } else {
      return "Play"
    }
  }

  // genius

  async getGenius() {

    this.isLyricView = !this.isLyricView;

    if (this.isLyricsLoaded) return;

    this.currentSongLyrics = 'Loading lyrics from Genius...';

    if (this.isLyricView) {
      this.geniusOptions.title = this.songName;
      this.geniusOptions.artist = this.artistName;
      getLyrics(this.geniusOptions).then((lyrics) => {
        console.log(lyrics);
        this.isLyricsLoaded = true;
        this.currentSongLyrics = lyrics;
        this.isLyricView = true;
      });
    }
  }

  getPlayerSetUpButtonText() {
    let btnTxt;
    (this.isPlayerSetUp) ?
      btnTxt = 'Connected' :
      btnTxt = 'Connect to Spotify';

    return btnTxt;
  }

}
