import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-sorting-menu',
  templateUrl: './sorting-menu.component.html',
  styleUrls: ['./sorting-menu.component.css']
})
export class SortingMenuComponent implements OnInit {
  currentSortingMethod;

  @Input()
  sortingOptions: string[];

  @Output()
  sortedPlaylists = new EventEmitter();

  constructor() { }

  ngOnInit(): void {
  }

  sortBy(sortingMethod) {
    let playlists = [];

    this.sortedPlaylists.emit(playlists);
  }

}
