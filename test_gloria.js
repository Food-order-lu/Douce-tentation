async function test() {
    console.log('Testing GloriaFood API...');
    try {
        const response = await fetch('https://pos.gloriafood.com/pos/order/pop', {
            method: 'POST',
            headers: {
                'Authorization': '9Mze5UqrRTYkE4dm9G',
                'Glf-Api-Version': '2',
                'Accept': 'application/json'
            }
        });
        console.log('Status:', response.status);
        if (response.status === 200) {
            const data = await response.json();
            console.log('Orders:', JSON.stringify(data, null, 2));
        } else if (response.status === 204) {
            console.log('No new orders.');
        } else {
            console.log('Failed:', await response.text());
        }
    } catch (e) {
        console.error('Error:', e);
    }
}
test();
