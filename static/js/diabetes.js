const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resize();
addEventListener("resize", resize);

const stars = Array.from({ length: 260 }, () => ({
  x: Math.random() * innerWidth,
  y: Math.random() * innerHeight,
  r: .3 + Math.random() * 1,
  a: Math.random(),
  s: .001 + Math.random() * .004,
  c: Math.random() > .35 ? "rgba(251,113,133," : "rgba(167,139,250,"
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.a += star.s;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.c + (0.1 + .6 * Math.abs(Math.sin(star.a))) + ")";
    ctx.fill();
  });
  requestAnimationFrame(draw);
}
draw();

const age = document.getElementById("age");
const bmi = document.getElementById("bmi");
const hba = document.getElementById("HbA1c_level");
const gluc = document.getElementById("blood_glucose_level");

age.oninput = () => ageVal.textContent = age.value;
bmi.oninput = () => bmiVal.textContent = parseFloat(bmi.value).toFixed(1);
hba.oninput = () => hbaVal.textContent = parseFloat(hba.value).toFixed(1) + "%";
gluc.oninput = () => glucVal.textContent = gluc.value;

let chartDonut, chartRadar, chartBar, chartHba;
const chartText = "rgba(240,240,255,.6)";
const grid = "rgba(255,255,255,.07)";

function destroy(chart) {
  if (chart) chart.destroy();
}

function setError(message) {
  error.style.display = message ? "block" : "none";
  error.textContent = message || "";
}

async function runPrediction() {
  setError("");
  predictBtn.textContent = "Analyzing...";
  predictBtn.disabled = true;

  const payload = {
    gender: gender.value,
    age: age.value,
    hypertension: hypertension.value,
    heart_disease: heart_disease.value,
    smoking_history: smoking_history.value,
    bmi: bmi.value,
    HbA1c_level: hba.value,
    blood_glucose_level: gluc.value
  };

  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Prediction failed");
    }

    renderResults(data);
  } catch (err) {
    setError("Could not complete prediction: " + err.message);
  } finally {
    predictBtn.textContent = "Analyze My Diabetes Risk";
    predictBtn.disabled = false;
  }
}

function cls(type) {
  return type === "good" ? "good" : type === "warn" ? "warn" : "bad";
}

function renderResults(data) {
  const diabetic = data.prediction === 1;
  const score = Math.round(data.risk_score);
  const input = data.input;
  const f = data.factors;

  const bmiNum = parseFloat(input.bmi);
  const hbaNum = parseFloat(input.HbA1c_level);
  const glucNum = parseFloat(input.blood_glucose_level);

  resultBox.className = "result " + (diabetic ? "diabetic" : "healthy");
  badge.className = "badge " + (diabetic ? "bad" : "good");
  badge.textContent = diabetic ? "Diabetes Risk Detected" : "No Diabetes Detected";
  title.textContent = diabetic ? "Elevated metabolic risk" : "Healthy metabolic profile";
  subtitle.textContent = diabetic
    ? `Model probability shows ${score}% diabetes risk. Please consult a healthcare professional.`
    : `Model probability shows ${score}% diabetes risk. Keep maintaining healthy habits.`;

  riskFill.style.background = diabetic
    ? "linear-gradient(90deg,#ffb84d,#fb7185)"
    : "linear-gradient(90deg,#2ee6a6,#a78bfa)";
  riskFill.style.width = score + "%";
  riskScore.textContent = score + "%";
  riskScore.style.color = diabetic ? "#fb7185" : "#2ee6a6";

  const statItems = [
    ["Gender", input.gender, "Model Feature", "good"],
    ["Age", input.age + " yrs", f.age_group, f.age_group === "Young" ? "good" : f.age_group === "Middle-aged" ? "warn" : "bad"],
    ["Hypertension", input.hypertension === "1" ? "Yes" : "No", input.hypertension === "1" ? "Risk Factor" : "Clear", input.hypertension === "1" ? "bad" : "good"],
    ["Heart Disease", input.heart_disease === "1" ? "Yes" : "No", input.heart_disease === "1" ? "Risk Factor" : "Clear", input.heart_disease === "1" ? "bad" : "good"],
    ["Smoking", input.smoking_history, input.smoking_history === "never" ? "Low Risk" : "Review", "warn"],
    ["BMI", bmiNum.toFixed(1), bmiNum < 25 ? "Normal" : bmiNum < 30 ? "Overweight" : "Obese", bmiNum < 25 ? "good" : bmiNum < 30 ? "warn" : "bad"],
    ["HbA1c", hbaNum.toFixed(1) + "%", hbaNum < 5.7 ? "Normal" : hbaNum < 6.5 ? "Pre-diabetic" : "Diabetic Range", hbaNum < 5.7 ? "good" : hbaNum < 6.5 ? "warn" : "bad"],
    ["Glucose", glucNum + " mg/dL", glucNum < 100 ? "Normal" : glucNum < 126 ? "Pre-diabetic" : "Diabetic Range", glucNum < 100 ? "good" : glucNum < 126 ? "warn" : "bad"]
  ];

  stats.innerHTML = statItems.map(s => `
    <div class="stat">
      <small>${s[0]}</small>
      <strong>${s[1]}</strong>
      <span class="pill ${cls(s[3])}">${s[2]}</span>
    </div>
  `).join("");

  destroy(chartDonut);
  destroy(chartRadar);
  destroy(chartBar);
  destroy(chartHba);

  chartDonut = new Chart(donut, {
    type: "doughnut",
    data: {
      labels: ["Diabetes Risk", "Healthy"],
      datasets: [{
        data: [data.probability_yes, data.probability_no],
        backgroundColor: ["rgba(251,113,133,.85)", "rgba(46,230,166,.8)"],
        borderColor: ["#fb7185", "#2ee6a6"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: { legend: { position: "bottom", labels: { color: chartText } } }
    }
  });

  chartRadar = new Chart(radar, {
    type: "radar",
    data: {
      labels: ["BMI", "HbA1c", "Glucose", "Age", "Hypertension", "Heart Disease"],
      datasets: [{
        data: [
          f.bmi_score,
          f.hba1c_score,
          f.glucose_score,
          f.age_score,
          input.hypertension === "1" ? 100 : 5,
          input.heart_disease === "1" ? 100 : 5
        ],
        backgroundColor: diabetic ? "rgba(251,113,133,.15)" : "rgba(46,230,166,.14)",
        borderColor: diabetic ? "#fb7185" : "#2ee6a6",
        pointBackgroundColor: diabetic ? "#fb7185" : "#2ee6a6"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { r: { min: 0, max: 100, grid: { color: grid }, ticks: { display: false }, pointLabels: { color: chartText } } },
      plugins: { legend: { display: false } }
    }
  });

  chartBar = new Chart(bar, {
    type: "bar",
    data: {
      labels: ["BMI", "HbA1c", "Glucose", "Age"],
      datasets: [{
        data: [f.bmi_score, f.hba1c_score, f.glucose_score, f.age_score],
        backgroundColor: ["#a78bfa", "#fb7185", "#e11d48", "#7c3aed"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: grid }, ticks: { color: chartText } },
        y: { min: 0, max: 100, grid: { color: grid }, ticks: { color: chartText } }
      },
      plugins: { legend: { display: false } }
    }
  });

  chartHba = new Chart(hbaChart, {
    type: "bar",
    data: {
      labels: ["Normal", "Pre-diabetic", "Diabetic"],
      datasets: [
        {
          label: "Threshold",
          data: [5.7, 6.4, 9],
          backgroundColor: ["rgba(46,230,166,.18)", "rgba(255,184,77,.18)", "rgba(251,113,133,.18)"]
        },
        {
          label: "Your HbA1c",
          data: [
            Math.min(hbaNum, 5.7),
            Math.min(Math.max(hbaNum - 5.7, 0), .7),
            Math.max(hbaNum - 6.4, 0)
          ],
          backgroundColor: "#a78bfa"
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: grid }, ticks: { color: chartText } },
        y: { grid: { color: grid }, ticks: { color: chartText } }
      },
      plugins: { legend: { labels: { color: chartText } } }
    }
  });

  reports.innerHTML = `
    <div class="report-card">
      <h3>Key Findings</h3>
      <p><b>BMI:</b> ${bmiNum.toFixed(1)}. ${bmiNum < 25 ? "Healthy range." : bmiNum < 30 ? "Overweight range." : "Obese range."}</p>
      <p><b>HbA1c:</b> ${hbaNum.toFixed(1)}%. ${hbaNum < 5.7 ? "Normal." : hbaNum < 6.5 ? "Pre-diabetic range." : "Diabetic range."}</p>
      <p><b>Glucose:</b> ${glucNum} mg/dL. ${glucNum < 100 ? "Normal." : glucNum < 126 ? "Pre-diabetic range." : "High range."}</p>
    </div>
    <div class="report-card">
      <h3>Model Output</h3>
      <p><b>Prediction:</b> ${diabetic ? "Diabetic risk" : "Non-diabetic"}</p>
      <p><b>Risk level:</b> ${data.risk_level}</p>
      <p><b>Probability:</b> diabetic ${data.probability_yes}%, healthy ${data.probability_no}%.</p>
    </div>
  `;

  adviceTitle.textContent = diabetic ? "Precautions & Action Plan" : "Benefits to Maintain";
  adviceSub.textContent = diabetic
    ? "Use these as screening suggestions and consult a clinician."
    : "Keep these protective habits consistent.";

  const adviceList = diabetic
    ? [
      ["Medical review", "Confirm with fasting glucose and HbA1c lab tests."],
      ["Low-GI diet", "Reduce sugary drinks and refined carbohydrates."],
      ["Exercise", "Target 150 minutes of moderate activity weekly."],
      ["Track numbers", "Monitor glucose, blood pressure, weight, and HbA1c."]
    ]
    : [
      ["Balanced diet", "Keep whole foods, fiber, and portion control steady."],
      ["Stay active", "Regular movement protects insulin sensitivity."],
      ["Annual checks", "Repeat glucose and HbA1c screening periodically."],
      ["Sleep and stress", "Good sleep and lower stress support glucose control."]
    ];

  advice.innerHTML = adviceList.map(a => `
    <div class="advice-card">
      <h3>${a[0]}</h3>
      <p>${a[1]}</p>
    </div>
  `).join("");

  results.style.display = "block";
  setTimeout(() => results.classList.add("show"), 30);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}



//INPUT UNDERSTAND

function updateFeatureGuide() {
  const genderVal = document.getElementById("gender").value;
  const ageValNum = document.getElementById("age").value;
  const hypertensionVal = document.getElementById("hypertension").value === "1" ? "Yes" : "No";
  const heartVal = document.getElementById("heart_disease").value === "1" ? "Yes" : "No";
  const smokingVal = document.getElementById("smoking_history").value;
  const bmiValNum = parseFloat(document.getElementById("bmi").value).toFixed(1);
  const hbaValNum = parseFloat(document.getElementById("HbA1c_level").value).toFixed(1);
  const glucoseValNum = document.getElementById("blood_glucose_level").value;

  document.getElementById("guide-gender").textContent = "Your value: " + genderVal;
  document.getElementById("guide-age").textContent = "Your value: " + ageValNum + " yrs";
  document.getElementById("guide-hypertension").textContent = "Your value: " + hypertensionVal;
  document.getElementById("guide-heart").textContent = "Your value: " + heartVal;
  document.getElementById("guide-smoking").textContent = "Your value: " + smokingVal;
  document.getElementById("guide-bmi").textContent = "Your value: " + bmiValNum;
  document.getElementById("guide-hba").textContent = "Your value: " + hbaValNum + "%";
  document.getElementById("guide-glucose").textContent = "Your value: " + glucoseValNum + " mg/dL";
}

[
  "gender",
  "age",
  "hypertension",
  "heart_disease",
  "smoking_history",
  "bmi",
  "HbA1c_level",
  "blood_glucose_level"
].forEach(id => {
  document.getElementById(id).addEventListener("input", updateFeatureGuide);
  document.getElementById(id).addEventListener("change", updateFeatureGuide);
});

updateFeatureGuide();



