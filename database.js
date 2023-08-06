import PocketBase from "pocketbase/cjs";

export default class Database {
    constructor() {
        this.pb = new PocketBase('http://127.0.0.1:8090');
        this.username = process.env.PB_USERNAME;
        this.password = process.env.PB_PASSWORD;
    }

    async _checkAuthentication() {
        if (!this.pb.authStore.isValid) {
            await this.pb.admins.authWithPassword(this.username, this.password);
        }
    }

    async getTrackList() {
        await this._checkAuthentication();
        return await this.pb.collection('Track').getFullList({
            sort: '-created',
        });
    }

    async getTrack(trackId) {
        await this._checkAuthentication();
        return await this.pb.collection('Track').getFullList({
            sort: '-created', filter: `id_track="${trackId}"`,
        });
    }

    async addTrack(track) {
        try {
            await this._checkAuthentication();
            return await this.pb.collection('Track').create(track);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the track:', error);
            }
        }
    }

    async deleteTrack(trackId) {
        await this._checkAuthentication();
        let ids = await this.getTrack(trackId);
        for (let i = 0; i < ids.length; i++) {
            console.log(ids[i].id);
            await this.pb.collection('Track').delete(ids[i].id);
        }
    }

    async addUser(userId, userName) {
        try {
            await this._checkAuthentication();

            const data = {
                "id_user": userId, "username": userName
            };

            return await this.pb.collection('User').create(data);
        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the user:', error);
            }
        }
    }

    async getUser(userId) {
        await this._checkAuthentication();
        return await this.pb.collection('User').getFullList({
            sort: '-created', filter: 'id_user="' + userId + '"',
        });
    }

    async getUsersList() {
        await this._checkAuthentication();
        return await this.pb.collection('User').getFullList({
            sort: '-created',
        });
    }

    async deleteUser(userId) {
        await this._checkAuthentication();
        return await this.pb.collection('User').delete(userId);
    }

    async addVote(vote, userId, trackId) {
        try {
            await this._checkAuthentication();

            const data = {
                "vote_answer": vote, "user_id": userId, "track_id": trackId,
            };

            return await this.pb.collection('Vote').create(data);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the vote:', error);
            }
        }
    }

    async getTodayVotesList() {
        await this._checkAuthentication();
        const today = new Date().toISOString().slice(0, 10)
        const beginTime = today + " 00:00:00.000"
        const stopTime = today + " 23:59:59.999"

        // Récupère les votes de la journée
        return await this.pb.collection('Vote').getFullList({
            filter: `created >= "${beginTime}" && created <= "${stopTime}"`,
        });
    }

    async getTodayUserVote(userId) {
        await this._checkAuthentication();
        const today = new Date().toISOString().slice(0, 10)
        const beginTime = today + " 00:00:00.000"
        const stopTime = today + " 23:59:59.999"

        // Récupère les votes de la journée du user avec comme id : userId
        // return await this.pb.collection('Vote').getFirstListItem(`created >= "${beginTime}" && created <= "${stopTime}" && user_id="${userId}"`,{
        //     sort: '-created',
        // });
        return await this.pb.collection('Vote').getFullList({
            sort: '-created', filter: `created >= "${beginTime}" && created <= "${stopTime}" && user_id="${userId}"`,
        });

    }

    async log(type, message) {
        try {
            await this._checkAuthentication();

            const data = {
                "type": type, "message": message
            };

            return await this.pb.collection('Log').create(data);

        } catch (error) {
            if (error.status !== 400) {
                console.error('An error occurred while adding the vote:', error);
            }
        }
    }
}
