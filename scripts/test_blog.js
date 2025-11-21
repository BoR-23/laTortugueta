const { getAllPosts } = require('../src/lib/blog');

async function test() {
    try {
        console.log('Fetching EN posts...');
        const postsEn = await getAllPosts('en');
        console.log('EN Posts:', postsEn);

        console.log('Fetching CA posts...');
        const postsCa = await getAllPosts('ca');
        console.log('CA Posts:', postsCa);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
