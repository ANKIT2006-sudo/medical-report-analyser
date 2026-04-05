from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

app = Flask(__name__)
# Enable CORS for all routes so the frontend can send fetch requests
CORS(app)

# Setup basic logging
logging.basicConfig(level=logging.INFO)

@app.route('/analyze', methods=['POST'])
def analyze():
    # Process JSON data from existing frontend request
    data = request.get_json()
    
    if not data:
        return jsonify({"status": "error", "message": "No JSON data provided"}), 400
        
    query = data.get("query", "").lower()
    category = data.get("category", "")

    if not query:
        return jsonify({"status": "error", "message": "Query cannot be empty"}), 400

    logging.info(f"[{datetime.now()}] Received request - Category: {category}, Query: {query}")

    # Simulated AI Processing / Rule-based logic
    # Base defaults (Low risk scenario)
    risk_level = "Low"
    analysis = f"Based on our analysis of the {category} report, no immediate critical hazards have been identified. Standard operational procedures should be followed."
    suggestions = [
        "Monitor the situation over the next 48 hours.",
        "Add an entry to the local municipal log.",
        "Schedule standard maintenance or review during the next operational cycle."
    ]

    # Keyword dictionaries for basic simulation matching
    high_risk_keywords = ["accident", "danger", "fire", "emergency", "crash", "hazard", "fatal", "blood", "gun"]
    medium_risk_keywords = ["waste", "garbage", "trash", "pothole", "delay", "smell", "spill", "broken"]

    # Simple logic mapping to user requirements
    if any(word in query for word in high_risk_keywords):
        risk_level = "High"
        analysis = f"CRITICAL: The {category} issue reported contains high-risk keywords. Advanced AI modeling predicts immediate escalation potential."
        suggestions = [
            "Dispatch emergency response teams to the location immediately.",
            "Issue a public safety alert to nearby residents.",
            "Reroute traffic dynamically to clear paths for emergency vehicles."
        ]
    elif any(word in query for word in medium_risk_keywords) or category == "waste":
        risk_level = "Medium"
        analysis = f"Elevated priority detected in the {category} report. Coordination between civil services is recommended to prevent compounding delays."
        suggestions = [
            "Schedule a priority service crew for assessment and cleanup within 24 hours.",
            "Alert local utility departments of a potential service disruption.",
            "Deploy a temporary monitoring sensor to track immediate developments."
        ]
    
    # Return matched response cleanly formatted for the frontend
    return jsonify({
        "status": "success",
        "analysis": analysis,
        "risk_level": risk_level,
        "suggestions": suggestions
    })

if __name__ == '__main__':
    # Running locally on port 5000 as specified
    app.run(debug=True, port=5000)
