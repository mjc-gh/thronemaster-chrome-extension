const URLS = [
    'https://www.thronemaster.net/?goto=gaming&sub=my_games',
    'https://www.thronemaster.net/?goto=gaming&sub=my_games&type=running&page=2',
];

class NotLoggedInError extends Error {}

async function fetchDoc(url) {
    const parser = new DOMParser();

    const response = await fetch(url);
    const html = await response.text();

    return parser.parseFromString(html, 'text/html');
}

async function fetchMyGamesDocuments() {
    const docs = [];

    for (const url of URLS) {
        const doc = await fetchDoc(url);

        if (doc.querySelector('input[type="password"]') !== null)
            throw new NotLoggedInError;

        docs.push(await fetchDoc(url));
    }

    return docs;
}

async function update() {
    try {
        const myGamesDocs = await fetchMyGamesDocuments();
        const count = myGamesDocs.reduce(
            (sum, doc) => sum + doc.querySelectorAll('table.btTableBox span[style]').length, 0
        );

        chrome.browserAction.setIcon({ path: 'images/thronemaster.png' });

        if (count > 0) {
            if (count === 1) {
                chrome.browserAction.setTitle({ title: `You have ${count} game to move in.` });
            } else {
                chrome.browserAction.setTitle({ title: `You have ${count} games to move in.` });
            }

            chrome.browserAction.setBadgeText({ text: `${count}` });
        } else {
            chrome.browserAction.setTitle({ title: 'You have no moves to make.' });
            chrome.browserAction.setBadgeText({ text: '' });
        }
    } catch(error) {
        if (error instanceof NotLoggedInError)
            chrome.browserAction.setTitle({ title: 'Please login to THRONEMASTER.NET.' });

        chrome.browserAction.setTitle({ title: 'Please login to THRONEMASTER.NET' });
        chrome.browserAction.setIcon({ path: 'images/thronemaster-inactive.png' });
        chrome.browserAction.setBadgeText({ text: '' });
    }
}

chrome.browserAction.setBadgeBackgroundColor({color:[0, 0, 0, 255]});
chrome.browserAction.onClicked.addListener(function(tab) {
    window.open(URLS[0] ,'_blank');
});

// Run immediately
update();

// Run every 2.5 minutes
setInterval(update, 2.5 * 60 * 1000);
