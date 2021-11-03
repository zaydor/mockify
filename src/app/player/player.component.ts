import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit {
  isPlayingMusic: boolean = false;
  currentSongName: string = '';
  access_token = '';
  @Input()
  songName: string;

  @Input()
  isSongPlaying: boolean;

  @Input()
  isShuffling: boolean;

  @Input()
  repeatingIndex: number;

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

  constructor() {
  }

  ngOnInit(): void {
  }

  playPausePress() {
    this.playPauseAction.emit();
  }

  nextSongPress() {
    this.nextSongAction.emit();
  }

  previousSongPress() {
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

}
