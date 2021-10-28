export class User {
    constructor(
        public email: string,
        public password: string,
        public displayName: string,
        public state: string
    ) { }
}