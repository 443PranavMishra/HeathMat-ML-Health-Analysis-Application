from flask import Flask, request, jsonify, render_template
import pandas as pd
import pickle
import os
import traceback

app = Flask(__name__)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# HELPER FUNCTIONS
def get_risk_level(score):
    if score < 30:
        return "Low"
    elif score < 70:
        return "Moderate"
    return "High"


def get_age_group(age):
    if age < 35:
        return "Young"
    elif age < 60:
        return "Middle-aged"
    return "Senior"


def load_pickle_model(path, label):
    model = None
    error = None

    try:
        print(f"Loading {label} model from:", path)

        if not os.path.exists(path):
            raise FileNotFoundError(f"{label} model not found at {path}")

        with open(path, "rb") as f:
            model = pickle.load(f)

        print(f"{label} model loaded successfully")
        print(f"{label} model type:", type(model))

    except Exception:
        error = traceback.format_exc()
        print(f"{label} model loading failed:")
        print(error)

    return model, error


# MODEL PATHS
DIABETES_MODEL_PATH = os.path.join(BASE_DIR, "diabetes.pkl")

HEART_MODEL_PATH = os.path.join(BASE_DIR, "heart_disease.pkl")

STROKE_MODEL_PATH = os.path.join(BASE_DIR, "brain_stroke.pkl")
SLEEP_MODEL_PATH = os.path.join(BASE_DIR, "sleep_health.pkl")

# LOAD MODELS
diabetes_pipeline, diabetes_model_error = load_pickle_model(DIABETES_MODEL_PATH, "Diabetes")
heart_pipeline, heart_model_error = load_pickle_model(HEART_MODEL_PATH, "Heart disease")
stroke_pipeline, stroke_model_error = load_pickle_model(STROKE_MODEL_PATH, "Brain stroke")
sleep_pipeline, sleep_model_error = load_pickle_model(SLEEP_MODEL_PATH, "Sleep health")


# PAGE ROUTES
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/diabetes")
def diabetes_page():
    return render_template("diabetes.html")


@app.route("/heart")
def heart_page():
    return render_template("heart.html")


@app.route("/stroke")
def stroke_page():
    return render_template("stroke.html")


@app.route("/sleep")
def sleep_page():
    return render_template("sleep.html")


# DIABETES API
@app.route("/predict", methods=["POST"])
def predict():
    if diabetes_pipeline is None:
        return jsonify({
            "success": False,
            "error": "Diabetes model not loaded",
            "details": diabetes_model_error
        }), 500

    try:
        data = request.get_json(silent=True) or {}

        required = [
            "gender", "age", "hypertension", "heart_disease",
            "smoking_history", "bmi", "HbA1c_level", "blood_glucose_level"
        ]

        missing = [x for x in required if x not in data]
        if missing:
            return jsonify({"success": False, "error": "Missing required fields: " + ", ".join(missing)}), 400

        input_df = pd.DataFrame([{
            "gender": data["gender"],
            "age": float(data["age"]),
            "hypertension": int(data["hypertension"]),
            "heart_disease": int(data["heart_disease"]),
            "smoking_history": data["smoking_history"],
            "bmi": float(data["bmi"]),
            "HbA1c_level": float(data["HbA1c_level"]),
            "blood_glucose_level": float(data["blood_glucose_level"])
        }])

        prediction = int(diabetes_pipeline.predict(input_df)[0])

        if hasattr(diabetes_pipeline, "predict_proba"):
            probabilities = diabetes_pipeline.predict_proba(input_df)[0]
            probability_no = round(float(probabilities[0]) * 100, 2)
            probability_yes = round(float(probabilities[1]) * 100, 2)
        else:
            probability_yes = 100 if prediction == 1 else 0
            probability_no = 100 - probability_yes

        risk_score = int(round(probability_yes))

        age = float(data["age"])
        bmi = float(data["bmi"])
        hba1c = float(data["HbA1c_level"])
        glucose = float(data["blood_glucose_level"])

        return jsonify({
            "success": True,
            "prediction": prediction,
            "risk_score": risk_score,
            "risk_level": get_risk_level(risk_score),
            "probability_yes": probability_yes,
            "probability_no": probability_no,
            "factors": {
                "age_group": get_age_group(age),
                "bmi_score": round(min((bmi / 40) * 100, 100), 2),
                "hba1c_score": round(min((hba1c / 9) * 100, 100), 2),
                "glucose_score": round(min((glucose / 300) * 100, 100), 2),
                "age_score": round(min((age / 100) * 100, 100), 2)
            },
            "input": data
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# HEART API
@app.route("/predict_heart", methods=["POST"])
def predict_heart():
    if heart_pipeline is None:
        return jsonify({
            "success": False,
            "error": "Heart disease model not loaded",
            "details": heart_model_error
        }), 500

    try:
        data = request.get_json(silent=True) or {}

        required = [
            "Age", "Sex", "ChestPainType", "RestingBP", "Cholesterol",
            "FastingBS", "RestingECG", "MaxHR", "ExerciseAngina",
            "Oldpeak", "ST_Slope"
        ]

        missing = [x for x in required if x not in data]
        if missing:
            return jsonify({"success": False, "error": "Missing required fields: " + ", ".join(missing)}), 400

        input_df = pd.DataFrame([{
            "Age": float(data["Age"]),
            "Sex": data["Sex"],
            "ChestPainType": data["ChestPainType"],
            "RestingBP": float(data["RestingBP"]),
            "Cholesterol": float(data["Cholesterol"]),
            "FastingBS": int(data["FastingBS"]),
            "RestingECG": data["RestingECG"],
            "MaxHR": float(data["MaxHR"]),
            "ExerciseAngina": data["ExerciseAngina"],
            "Oldpeak": float(data["Oldpeak"]),
            "ST_Slope": data["ST_Slope"]
        }])

        prediction = int(heart_pipeline.predict(input_df)[0])

        if hasattr(heart_pipeline, "predict_proba"):
            probabilities = heart_pipeline.predict_proba(input_df)[0]
            probability_no = round(float(probabilities[0]) * 100, 2)
            probability_yes = round(float(probabilities[1]) * 100, 2)
        else:
            probability_yes = 100 if prediction == 1 else 0
            probability_no = 100 - probability_yes

        risk_score = int(round(probability_yes))

        age = float(data["Age"])
        bp = float(data["RestingBP"])
        chol = float(data["Cholesterol"])
        hr = float(data["MaxHR"])
        oldpeak = float(data["Oldpeak"])

        return jsonify({
            "success": True,
            "prediction": prediction,
            "risk_score": risk_score,
            "risk_level": get_risk_level(risk_score),
            "probability_yes": probability_yes,
            "probability_no": probability_no,
            "factors": {
                "age_score": round(min((age / 100) * 100, 100), 2),
                "bp_score": round(min((bp / 200) * 100, 100), 2),
                "chol_score": round(min((chol / 400) * 100, 100), 2),
                "hr_score": round(max(0, 100 - ((hr / 220) * 100)), 2),
                "oldpeak_score": round(min((oldpeak / 6) * 100, 100), 2),
                "fasting_score": 80 if int(data["FastingBS"]) == 1 else 10
            },
            "input": data
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# STROKE API
@app.route("/predict_stroke", methods=["POST"])
def predict_stroke():
    if stroke_pipeline is None:
        return jsonify({
            "success": False,
            "error": "Brain stroke model not loaded",
            "details": stroke_model_error
        }), 500

    try:
        data = request.get_json(silent=True) or {}

        required = [
            "gender", "age", "hypertension", "heart_disease",
            "ever_married", "work_type", "Residence_type",
            "avg_glucose_level", "bmi", "smoking_status"
        ]

        missing = [x for x in required if x not in data]
        if missing:
            return jsonify({"success": False, "error": "Missing required fields: " + ", ".join(missing)}), 400

        input_df = pd.DataFrame([{
            "gender": data["gender"],
            "age": float(data["age"]),
            "hypertension": int(data["hypertension"]),
            "heart_disease": int(data["heart_disease"]),
            "ever_married": data["ever_married"],
            "work_type": data["work_type"],
            "Residence_type": data["Residence_type"],
            "avg_glucose_level": float(data["avg_glucose_level"]),
            "bmi": float(data["bmi"]),
            "smoking_status": data["smoking_status"]
        }])

        prediction = int(stroke_pipeline.predict(input_df)[0])

        if hasattr(stroke_pipeline, "predict_proba"):
            probabilities = stroke_pipeline.predict_proba(input_df)[0]
            probability_no = round(float(probabilities[0]) * 100, 2)
            probability_yes = round(float(probabilities[1]) * 100, 2)
        else:
            probability_yes = 100 if prediction == 1 else 0
            probability_no = 100 - probability_yes

        risk_score = int(round(probability_yes))

        age = float(data["age"])
        glucose = float(data["avg_glucose_level"])
        bmi = float(data["bmi"])
        smoking_status = data["smoking_status"]

        if smoking_status == "formerly smoked":
            smoking_score = 45
        elif smoking_status == "smokes":
            smoking_score = 75
        elif smoking_status == "Unknown":
            smoking_score = 25
        else:
            smoking_score = 12

        return jsonify({
            "success": True,
            "prediction": prediction,
            "risk_score": risk_score,
            "risk_level": get_risk_level(risk_score),
            "probability_yes": probability_yes,
            "probability_no": probability_no,
            "factors": {
                "age_group": get_age_group(age),
                "age_score": round(min((age / 100) * 100, 100), 2),
                "glucose_score": round(min((glucose / 250) * 100, 100), 2),
                "bmi_score": round(min((bmi / 45) * 100, 100), 2),
                "hypertension_score": 85 if int(data["hypertension"]) == 1 else 10,
                "heart_score": 85 if int(data["heart_disease"]) == 1 else 10,
                "smoking_score": smoking_score
            },
            "input": data
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# SLEEP API
@app.route("/predict_sleep", methods=["POST"])
def predict_sleep():
    if sleep_pipeline is None:
        return jsonify({
            "success": False,
            "error": "Sleep health model not loaded",
            "details": sleep_model_error
        }), 500

    try:
        data = request.get_json(silent=True) or {}

        required = [
            "Gender", "Age", "Occupation", "Sleep Duration",
            "Quality of Sleep", "Physical Activity Level", "Stress Level",
            "BMI Category", "Blood Pressure", "Heart Rate", "Daily Steps"
        ]

        missing = [x for x in required if x not in data]
        if missing:
            return jsonify({"success": False, "error": "Missing required fields: " + ", ".join(missing)}), 400

        input_df = pd.DataFrame([{
            "Gender": data["Gender"],
            "Age": float(data["Age"]),
            "Occupation": data["Occupation"],
            "Sleep Duration": float(data["Sleep Duration"]),
            "Quality of Sleep": int(data["Quality of Sleep"]),
            "Physical Activity Level": int(data["Physical Activity Level"]),
            "Stress Level": int(data["Stress Level"]),
            "BMI Category": data["BMI Category"],
            "Blood Pressure": float(data["Blood Pressure"]),
            "Heart Rate": int(data["Heart Rate"]),
            "Daily Steps": int(data["Daily Steps"])
        }])

        prediction_raw = sleep_pipeline.predict(input_df)[0]
        prediction_label = str(prediction_raw)

        probabilities_dict = {}
        risk_score = 0

        if hasattr(sleep_pipeline, "predict_proba"):
            probabilities = sleep_pipeline.predict_proba(input_df)[0]
            classes = [str(c) for c in sleep_pipeline.classes_]

            probabilities_dict = {
                classes[i]: round(float(probabilities[i]) * 100, 2)
                for i in range(len(classes))
            }

            healthy_labels = ["None", "Normal", "No Disorder", "No Sleep Disorder", "nan"]
            healthy_probability = 0

            for label in healthy_labels:
                if label in probabilities_dict:
                    healthy_probability = probabilities_dict[label]
                    break

            if healthy_probability > 0:
                risk_score = int(round(100 - healthy_probability))
            else:
                risk_score = int(round(max(probabilities_dict.values())))

        else:
            safe_labels = ["None", "Normal", "No Disorder", "No Sleep Disorder"]
            risk_score = 0 if prediction_label in safe_labels else 100
            probabilities_dict = {prediction_label: 100}

        sleep_duration = float(data["Sleep Duration"])
        quality = int(data["Quality of Sleep"])
        activity = int(data["Physical Activity Level"])
        stress = int(data["Stress Level"])
        heart_rate = int(data["Heart Rate"])
        steps = int(data["Daily Steps"])

        sleep_score = 100 if 7 <= sleep_duration <= 9 else max(0, 100 - abs(7.5 - sleep_duration) * 25)
        quality_score = quality * 10
        activity_score = activity
        stress_score = stress * 10
        heart_score = 20 if 60 <= heart_rate <= 80 else min(100, abs(heart_rate - 70) * 2)
        steps_score = min((steps / 10000) * 100, 100)

        return jsonify({
            "success": True,
            "prediction": prediction_label,
            "prediction_label": prediction_label,
            "risk_score": risk_score,
            "risk_level": get_risk_level(risk_score),
            "probabilities": probabilities_dict,
            "factors": {
                "sleep_score": round(sleep_score, 2),
                "quality_score": round(quality_score, 2),
                "activity_score": round(activity_score, 2),
                "stress_score": round(stress_score, 2),
                "heart_score": round(heart_score, 2),
                "steps_score": round(steps_score, 2)
            },
            "input": data
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# RUN APP - ALWAYS LAST
if __name__ == "__main__":
    app.run(debug=True)
