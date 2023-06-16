const express = require('express');
const app = express();
const port = process.env.PORT || 8080;
const admin = require('firebase-admin');


const serviceAccount = require('./firebaseServiceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const postsCollection = db.collection('');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Endpoint untuk mendapatkan semua forum
app.get('/api/posts', async (req, res) => {
  try {
    const snapshot = await postsCollection.get();
    const data = snapshot.docs.map((doc) => doc.data());
    res.json(data);
  } catch (error) {
    console.error('Error getting posts: ', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

// Endpoint untuk membuat forum baru
app.post('/api/posts', async (req, res) => {
  try {
    const newPost = {
      title: req.body.title,
      content: req.body.content,
      replies: []
    };

    const docRef = await postsCollection.add(newPost);
    const postId = docRef.id;
    res.status(201).json({ id: postId, ...newPost });
  } catch (error) {
    console.error('Error adding post: ', error);
    res.status(500).json({ error: 'Failed to add post' });
  }
});

// Endpoint untuk membuat balasan pada forum
app.post('/api/posts/:id/replies', async (req, res) => {
  try {
    const postId = req.params.id;
    const newReply = {
      content: req.body.content
    };

    const postDoc = await postsCollection.doc(postId).get();
    const post = postDoc.data();
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    post.replies.push(newReply);

    await postsCollection.doc(postId).update({ replies: post.replies });
    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error adding reply: ', error);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Endpoint untuk mengedit forum berdasarkan ID
app.put('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;
    const updatedPost = {
      title: req.body.title,
      content: req.body.content
    };

    await postsCollection.doc(postId).update(updatedPost);
    res.status(200).json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post: ', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Endpoint untuk menghapus forum berdasarkan ID
app.delete('/api/posts/:id', async (req, res) => {
  try {
    const postId = req.params.id;

    await postsCollection.doc(postId).delete();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post: ', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
