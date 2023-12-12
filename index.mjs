// node --no-warnings=ExperimentalWarning index.mjs
import players from "./players.json" with { type: "json" };

const BASE_URL = "https://backbone-web-api.production.leuven.delcom.nl";

const sessionResults = await retrieveSessions();
const [fstId, sndId] = sessionResults.data.map(booking => booking.bookingId);
console.log(`Retrieved both badminton sessions: ${fstId} & ${sndId}.`);

const bookingResults = await Promise.allSettled(
    players.flatMap(player => [
        book(player, fstId),
        book(player, sndId)
    ])
);

bookingResults.forEach(async res => {
    const val = await res.value.json();
    console.log(`Response: ${JSON.stringify(val)}.`);
});


async function retrieveSessions() {
    const [thursday, thursdayEnd] = getThursdayDates();

    const params = "join=linkedProduct&join=linkedProduct.translations&join=product&join=product.translations";
    const sessionRequest = {
        "startDate": thursday.toISOString(),
        "endDate": thursdayEnd.toISOString(),
        "tagIds": {"$in": [71]},
        "availableFromDate": {"$gt": thursday.toISOString()},
        "availableTillDate":{"$gte": thursday.toISOString()}
    }

    console.log(`Retrieving all badminton sessions on ${thursday.toISOString()}...`);
    const response = await fetch(`${BASE_URL}/bookable-slots?s=${JSON.stringify(sessionRequest)}&${params}`);
    return response.json();
}

async function book({name, playerId, token}, bookingId) {
    const bookingRequest = {
        "memberId": playerId,
        "bookingId": bookingId,
        "params": {
            "bookableProductId": 2249,
            "bookableLinkedProductId": 4057,
        }
    }

    console.log(`Trying to book session ${bookingId} for ${name}...`);
    return await fetch(`${BASE_URL}/participations`, {
        method: "POST",
        body: JSON.stringify(bookingRequest),
        headers: {
            "Content-Type": "application/json",
            "Authorization": token,
        },
    });
}

function getThursdayDates() {
    const now = new Date();

    const thursday = new Date(now);
    thursday.setDate(now.getDate() - now.getDay() + 4);
    thursday.setHours(1);
    thursday.setMinutes(0, 0, 0);

    const thursdayEnd = new Date(thursday);
    thursdayEnd.setHours(thursday.getHours() + 23);

    return [thursday, thursdayEnd];
}