const functions = require("../structs/functions.js");

module.exports = async (wss) => {
    const ticketId = functions.MakeID().replace(/-/ig, "");
    const matchId = functions.MakeID().replace(/-/ig, "");
    const sessionId = functions.MakeID().replace(/-/ig, "");


    let waitingTime = false;
    let queuedPlayers = 0;
    let username;

    async function handleConnection(ws, req) {
        if (ws.protocol.toLowerCase().includes("xmpp")) {
            return ws.close();
        }

        const authHeader = req.headers['authorization'];
        if (!authHeader) return ws.close();

        const authpart = authHeader.split(' ');
        if (authpart.length < 5) return ws.close();
        username = authpart[4];

        queuedPlayers++;
        console.log(username, "connected");
        
        await sendStatus(ws, "Connecting");
        await functions.sleep(800);
        await sendStatus(ws, "Waiting", { totalPlayers: 1, connectedPlayers: 1 });
        await functions.sleep(1000);
        await sendStatus(ws, "Queued", { ticketId, queuedPlayers, estimatedWaitSec: 0 });
        await functions.sleep(4000);
        await sendStatus(ws, "SessionAssignment", { matchId });
        await functions.sleep(2000);
        await sendPlay(ws, matchId, sessionId);

        ws.on('close', () => {
            queuedPlayers = Math.max(0, queuedPlayers - 1); 
            log.player(username, "disconnected");
        });
    }


    async function sendStatus(ws, state, extraPayload = {}) {
        const payload = {
            ...extraPayload,
            state
        };
        ws.send(JSON.stringify({
            payload,
            name: "StatusUpdate"
        }));
    }


    async function sendPlay(ws, matchId, sessionId) {
        ws.send(JSON.stringify({
            payload: {
                matchId,
                sessionId,
                joinDelaySec: 1
            },
            name: "Play"
        }));
    }

    wss.on('connection', handleConnection);
};
