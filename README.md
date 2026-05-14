# 🩺 HealthMat – AI Powered Health Analysis Web Application

# 🔗 Download Machine Learning Models (.pkl files)

1. **Diabetes Model**  
   https://www.kaggle.com/models/pranavmishra443/diabetes-healthmat

2. **Heart Disease Model**  
   https://www.kaggle.com/models/pranavmishra443/heart-disease-healthmat

3. **Brain Stroke Model**  
   https://www.kaggle.com/models/pranavmishra443/brain-stroke-healthmat

4. **Sleep Health Model**  
   https://www.kaggle.com/models/pranavmishra443/sleep-health-healthmat

---

## 📌 Project Aim
**HealthMat** is a Machine Learning based web application developed using Flask that helps analyze the health condition of patients through predictive models.  
The application integrates multiple trained ML models for different health-related predictions such as:

- Diabetes Prediction
- Heart Disease Prediction
- Sleep Health Analysis
- Brain Stroke Prediction

The goal of HealthMat is to provide a simple, interactive, and intelligent healthcare analysis platform through a user-friendly web interface.

---

# 🚀 Features

✅ Multiple Machine Learning Models Integrated  
✅ Flask-Based Web Application  
✅ Interactive Frontend using HTML, CSS & JavaScript  
✅ Real-Time Health Prediction  
✅ User-Friendly Interface  
✅ Fast and Lightweight Application  

---

# 🛠️ Tech Stack Used

## Backend
- Python 3.11.9
- Flask 3.0.3

## Frontend
- HTML5
- CSS3
- JavaScript

## Machine Learning Libraries
- Scikit-Learn
- XGBoost
- CatBoost
- LightGBM
- Imbalanced-Learn

## Data Analysis & Visualization
- Pandas
- NumPy
- Matplotlib
- Seaborn

---

# 📦 Dependencies

```txt
python==3.11.9

Flask==3.0.3
Werkzeug==3.0.3
Jinja2==3.1.4
MarkupSafe==2.1.5
itsdangerous==2.2.0
click==8.1.7
blinker==1.8.2

pandas==2.2.2
numpy==1.26.4
scipy==1.13.1
scikit-learn==1.4.2
imbalanced-learn==0.12.3
joblib==1.4.2
threadpoolctl==3.5.0

matplotlib==3.8.4
seaborn==0.13.2
contourpy==1.2.1
cycler==0.12.1
fonttools==4.53.1
kiwisolver==1.4.5
pillow==10.4.0
pyparsing==3.1.2

xgboost==2.0.3
catboost==1.2.5
lightgbm==4.3.0
graphviz==0.20.3

pickle-mixin==1.0.2
```

---

# ⚙️ Process to Run the Application

## Step 1 – Download Model Files
Download all trained machine learning model files from the provided link.

---

## Step 2 – Create a Virtual Environment

```bash
python -m venv myvenv
```

---

## Step 3 – Activate Virtual Environment

### Windows
```bash
myvenv\Scripts\activate
```

### Linux / Mac
```bash
source myvenv/bin/activate
```

---

## Step 4 – Copy Project Files
Paste all:
- Flask application files
- Templates
- Static files
- Model `.pkl` files

inside the project folder.

---

## Step 5 – Open Project in VS Code
Open the complete project folder in Visual Studio Code.

---

## Step 6 – Install Dependencies

Open terminal and run:

```bash
pip install -r requirements.txt
```

---

## Step 7 – Verify Flask File Structure

Your project structure should look similar to this:

```txt
HEATHMAT/
│
├── static/
│   ├── css/
│   └── js/
│
├── templates/
│   ├── index.html
│   ├── diabetes.html
│   ├── heart.html
│   ├── sleep.html
│   └── stroke.html
│
├── app.py
├── diabetes.pkl
├── heart_disease.pkl
├── brain_stroke.pkl
├── sleep_health.pkl
└── requirements.txt
```

---

## Step 8 – Run the Flask Application

```bash
python app.py
```

---

## Step 9 – Open in Browser
Copy the generated local server URL and open it in your browser.

Example:

```txt
http://127.0.0.1:5000/
```

---

# 📷 Project Structure Preview

The project follows a standard Flask application structure with:
- `templates/` for HTML pages
- `static/` for CSS & JavaScript
- `.pkl` files for trained ML models
- `app.py` as the main Flask application

---

# 🧠 Machine Learning Models Used

| Model Type | Purpose |
|------------|----------|
| Diabetes Model | Diabetes Prediction |
| Heart Disease Model | Heart Health Analysis |
| Stroke Model | Brain Stroke Prediction |
| Sleep Health Model | Sleep Disorder & Health Analysis |

---

# 💻 How It Works

1. User enters health-related information.
2. Data is sent to Flask backend.
3. Machine Learning model processes the input.
4. Prediction result is generated instantly.
5. Output is displayed on the web interface.

---

# 📈 Future Improvements

- User Authentication System
- More Models Integration
- Deployment on Cloud
- Report Reader To Prediction
- Advanced Medical Analytics
- AI Chat Assistant for Health Guidance

---

# 👨‍💻 Developed By

**Pranav Mishra**  
Machine Learning | Data Science | Deep Learning | Web Development

---
