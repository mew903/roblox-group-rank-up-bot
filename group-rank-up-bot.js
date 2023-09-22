const RANKUP_AMT_FOLLOWERS = 75
const RANKDOWN_AMT_FOLLOWERS = 50

const FRIEND_ROLE_ID = '50980056'
const TESTER_ROLE_ID = '45209174'
const FAN_ROLE_ID = '44892096'

const X_CSRF_TOKEN = '------------' // TODO: CHANGE EVERY USE

async function getMyFriends() {
    const response = await fetch('https://friends.roblox.com/v1/users/771417/friends', {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return response.json()
}

async function fetchGroupUsers(cursor = '') {
    const response = await fetch('https://groups.roblox.com/v1/groups/7092115/users?limit=100&cursor=' + cursor, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return response.json()
}

async function fetchUserFollowers(userId) {
    const response = await fetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`, {
        headers: {
            'Content-Type': 'application/json',
        }
    })
    return response.json()
}

async function requestSetUserRank(userId, roleId) {
    const response = await fetch(`https://groups.roblox.com/v1/groups/7092115/users/${userId}`, {
        credentials: 'include',
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': document.cookie,
            'x-csrf-token': X_CSRF_TOKEN,
        },
        body: JSON.stringify({
            'roleId': roleId
        })
    })
    return response.status
}

async function checkForRankUp(userId, username) {
    const data = await fetchUserFollowers(userId)
    if (data.count >= RANKUP_AMT_FOLLOWERS) {
        const status = await requestSetUserRank(userId, TESTER_ROLE_ID)
        console.log(`rank up [${status}] ${username} | ${data.count}`)
    }
}

async function checkForRankDown(userId, username) {
    const data = await fetchUserFollowers(userId)
    if (data.count < RANKDOWN_AMT_FOLLOWERS) {
        const status = await requestSetUserRank(userId, FAN_ROLE_ID)
        console.log(`rank down [${status}] ${username} | ${data.count}`)
    }
}

function fetchGroupUsersLoop(friends, cursor = '') {
    fetchGroupUsers(cursor).then((json) => {
        json.data.forEach((element) => {
            const role = element.role.name
            const userId = element.user.userId
            const username = element.user.username
            if (friends.includes(userId) && role === 'Fan') {
                requestSetUserRank(userId, FRIEND_ROLE_ID).then((status) => {
                    console.log(`friend [${status}] ${username}`)
                })
            } else {
                if (role === 'Fan') {
                    checkForRankUp(userId, username)
                } else if (role === 'Tester') {
                    checkForRankDown(userId, username)
                }
            }
        });


        if (json.nextPageCursor) {
            fetchGroupUsersLoop(friends, json.nextPageCursor)
        } else {
            console.log('all done!')
        }
    })
}

getMyFriends().then((list) => {
    const friends = []
    list.data.forEach((element) => {
        friends.push(element.id)
    })
    fetchGroupUsersLoop(friends)
})
