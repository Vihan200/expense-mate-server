app.get("/api/groups", async (req, res) => {
    try {
      const db = client.db("RAD"); // Replace with your database name
      const groupsCollection = db.collection("Groups"); // Replace with your collection name
      const groups = await groupsCollection.find({}).toArray();
      res.status(200).json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });