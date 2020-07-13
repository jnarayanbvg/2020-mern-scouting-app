/// Define API routes for comps database

const express = require("express");
const router = express.Router();
const { format } = require("fecha");
const verifyToken = require("./verifyToken");

// Create small utility functions
const fix = (str) => str.replace(/['",`\\;]/g, "\\$&");

/* EXPORT
   Function containing all API routes */

module.exports = (pool) => {
   /**
    * Retrieve an array of all matches from a specific competition
    * @params id (competition ID int)
    * @auth Bearer <token> (token received from login)
    */
   router.get("/:id", verifyToken, async (req, res) => {
      // Analyze request
      const { username } = req.auth.user;
      const { id } = req.params;

      // Handle response and track error source locations
      let errMessage;
      try {
         /* Check if this competition is valid for this user
          */
         let sql = `SELECT * FROM competitions WHERE ID = ? AND Username = ?`;
         errMessage = "Failed to get competitions";
         const [userComp] = await pool.execute(sql, [id, username]);
         errMessage = "Invalid competition for this user";
         if (!userComp.length) throw "";
         /* */

         // Query database for matches in this competition
         sql = `SELECT * FROM matchData WHERE CompetitionID = ? ORDER BY ID ASC`;
         errMessage = "Failed to get match data";
         const [result] = await pool.execute(sql, [id]);

         // Success!
         res.send(result);
      } catch (err) {
         // Send error message
         res.send({ message: errMessage, type: "bad", err });
      }
   });

   /**
    * Post a piece of match data to a specific competition
    * @params id (competition ID int)
    * @auth Bearer <token> (token received from login)
    * @auth isAdmin (token must contain affirmative isAdmin property)
    */
   router.post("/:id", verifyToken, async (req, res) => {
      // Analyze request
      const { username } = req.auth.user;
      const { id } = req.params;
      const {
         updated,
         teamNumber,
         matchNumber,
         robotStation,
         eventArray,
         outerHeatmap,
         innerHeatmap,
         pickupHeatmap,
         crossLine,
         numberBottomAuto,
         numberOuterAuto,
         numberInnerAuto,
         numberBottom,
         numberOuter,
         numberInner,
         numberPickup,
         timeDefended,
         timeDefending,
         numberFouls,
         defenseQuality,
         timeMal,
         timeRotation,
         timePosition,
         successRotation,
         successPosition,
         endgameScore,
         endgameLevel,
         score,
         comments,
         scoutName,
      } = req.body;

      // Handle response and track error source locations
      let errMessage;
      try {
         /* Check if this competition is valid for this user
          */
         let sql = `SELECT * FROM competitions WHERE ID = ? AND Username = ?`;
         errMessage = "Failed to get competitions";
         const [userComp] = await pool.execute(sql, [id, username]);
         errMessage = "Invalid competition for this user";
         if (!userComp.length) throw "";
         /* */

         // First, send an UPDATE in case the match had been generated previously
         sql = `UPDATE matchData SET DateTime = ?, Updated = ?, RobotStation = ?, EventArray = ?, OuterHeatmap = ?, InnerHeatmap = ?, PickupHeatmap = ?, CrossLine = ?, NumberBottomAuto = ?, NumberOuterAuto = ?, NumberInnerAuto = ?, NumberBottom = ?, NumberOuter = ?, NumberInner = ?, NumberPickup = ?, TimeDefended = ?, TimeDefending = ?, NumberFouls = ?, DefenseQuality = ?, TimeMal = ?, TimeRotation = ?, TimePosition = ?, SuccessRotation = ?, SuccessPosition = ?, EndgameScore = ?, EndgameLevel = ?, Score = ?, Comments = ?, ScoutName = ? WHERE CompetitionID = ? AND TeamNumber = ? AND MatchNumber = ?`;
         errMessage = "Failed to attempt updating existing match data";
         const [updateResult] = await pool.execute(sql, [
            format(new Date(), "YYYY-MM-DD HH:mm:ss"), // A datetime marker
            updated,
            robotStation,
            fix(eventArray),
            fix(outerHeatmap),
            fix(innerHeatmap),
            fix(pickupHeatmap),
            crossLine,
            numberBottomAuto,
            numberOuterAuto,
            numberInnerAuto,
            numberBottom,
            numberOuter,
            numberInner,
            numberPickup,
            timeDefended,
            timeDefending,
            numberFouls,
            defenseQuality,
            timeMal,
            timeRotation,
            timePosition,
            successRotation,
            successPosition,
            endgameScore,
            endgameLevel,
            score,
            fix(comments),
            fix(scoutName),
            id, // Identify where to update
            teamNumber, // Identify where to update
            fix(matchNumber), // Identify where to update
         ]);

         // Next, if no data was updated (match data was not preloaded), INSERT new data
         errMessage = "Found no competition to update";
         if (!updateResult.affectedRows) {
            sql = `INSERT INTO matchData (DateTime, Updated, CompetitionID, TeamNumber, MatchNumber, RobotStation, EventArray, OuterHeatmap, InnerHeatmap, PickupHeatmap, CrossLine, NumberBottomAuto, NumberOuterAuto, NumberInnerAuto, NumberBottom, NumberOuter, NumberInner, NumberPickup, TimeDefended, TimeDefending, NumberFouls, DefenseQuality, TimeMal, TimeRotation, TimePosition, SuccessRotation, SuccessPosition, EndgameScore, EndgameLevel, Score, Comments, ScoutName) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            errMessage = "Failed to post new match data";
            const [insertResult] = await pool.execute(sql, [
               format(new Date(), "YYYY-MM-DD HH:mm:ss"), // A datetime marker
               updated,
               id,
               teamNumber,
               fix(matchNumber),
               robotStation,
               fix(eventArray),
               fix(outerHeatmap),
               fix(innerHeatmap),
               fix(pickupHeatmap),
               crossLine,
               numberBottomAuto,
               numberOuterAuto,
               numberInnerAuto,
               numberBottom,
               numberOuter,
               numberInner,
               numberPickup,
               timeDefended,
               timeDefending,
               numberFouls,
               defenseQuality,
               timeMal,
               timeRotation,
               timePosition,
               successRotation,
               successPosition,
               endgameScore,
               endgameLevel,
               score,
               fix(comments),
               fix(scoutName),
            ]);

            // Success!
            res.status(201).send({
               message: "Successfully posted new match data",
               type: "good",
            });
         } else {
            // Success!
            res.status(201).send({
               message: "Successfully updated existing match data",
               type: "good",
            });
         }
      } catch (err) {
         // Send error message
         res.send({ message: errMessage, type: "bad", err });
      }
   });

   return router;
};