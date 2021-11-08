import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-playlist-box',
  templateUrl: './playlist-box.component.html',
  styleUrls: ['./playlist-box.component.css']
})
export class PlaylistBoxComponent implements OnInit {

  @Input()
  playlistInfo;

  @Input()
  index;

  @Input()
  playlistActionIcon;

  @Input()
  isFrontPage;

  @Output()
  openPlaylistDialogAction = new EventEmitter();

  @Output()
  quickPlayAction = new EventEmitter();

  @Output()
  playlistAction = new EventEmitter();



  constructor() { }

  ngOnInit(): void {
  }

  quickPlayPlaylist(index) {
    this.quickPlayAction.emit(index);
  }

  playlistSpecialAction(index) {
    this.playlistAction.emit(index);
  }

  getSpecialActionToolTipText() {
    if (this.isFrontPage) {
      return 'Follow/unfollow playlist';
    }

    return 'Publish/delete playlist from front page'
  }

}
