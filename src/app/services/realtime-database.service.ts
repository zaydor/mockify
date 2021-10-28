import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { getDatabase, ref, set, onValue, child, get, push, update, remove, Database, runTransaction } from 'firebase/database';

@Injectable({
  providedIn: 'root'
})
export class RealtimeDatabaseService {
  private db: Database;

  constructor(private database: AngularFireDatabase) {
    this.db = getDatabase();
  }

  setDatabase(tableName: string, id: string, data: any) {
    set(ref(this.db, tableName + id), data);
  }

  readDatabase(tableName: string, id: number) {
    const testCountRef = ref(this.db, tableName + '/' + id);
    onValue(testCountRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);
      return data;
    });
  }

  async updateDatabase(tableName: string, id: number, newData: any) {
    // const newToken = {
    //   username: 'joe',
    //   refresh_token: '321'
    // }

    // const newKey = push(child(ref(this.db), 'test')).key;
    // console.log(newKey);

    // const updates = {};
    // updates['test/' + 0] = newToken;
    const newKey = push(child(ref(this.db), tableName)).key;

    const updates = {};
    updates[tableName + '/' + id] = newData;

    return update(ref(this.db), updates);
  }

  deleteDatabase(tableName: string, id: number) {
    remove(ref(this.db, 'test/' + 0));
  }
}
