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
  c: Math.random() > .55 ? "rgba(167,139,250," : "rgba(251,113,133,"
}));

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(star => {
    star.a += star.s;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fillStyle = star.c + (0.1 + .55 * Math.abs(Math.sin(star.a))) + ")";
    ctx.fill();
  });
  requestAnimationFrame(draw);
}
draw();

const bindRange = (id, out, format = value => value) => {
  const input = document.getElementById(id);
  const output = document.getElementById(out);
  input.addEventListener("input", () => output.textContent = format(input.value));
};

bindRange("age", "ageVal");
bindRange("avg_glucose_level", "glucoseVal");
bindRange("bmi", "bmiVal", v => Number(v).toFixed(1));

let chartDonut, chartRadar, chartBar, chartVitals;
const chartText = "rgba(240,240,255,.6)";
const grid = "rgba(255,255,255,.07)";

function destroy(chart) {
  if (chart) chart.destroy();
}

function setError(message) {
  error.style.display = message ? "block" : "none";
  error.textContent = message || "";
}

async function runStrokePrediction() {
  setError("");
  predictBtn.textContent = "Analyzing...";
  predictBtn.disabled = true;

  const payload = {
    gender: gender.value,
    age: age.value,
    hypertension: hypertension.value,
    heart_disease: heart_disease.value,
    ever_married: ever_married.value,
    work_type: work_type.value,
    Residence_type: Residence_type.value,
    avg_glucose_level: avg_glucose_level.value,
    bmi: bmi.value,
    smoking_status: smoking_status.value
  };

  try {
    const res = await fetch("/predict_stroke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error((data.error || "Prediction failed") + "\n" + (data.details || ""));
    }

    renderStrokeResults(data);
  } catch (err) {
    setError("Could not complete prediction: " + err.message);
  } finally {
    predictBtn.textContent = "Analyze Brain Stroke Risk";
    predictBtn.disabled = false;
  }
}

function statusClass(type) {
  return type === "good" ? "good" : type === "warn" ? "warn" : "bad";
}

function renderStrokeResults(d) {
  const highRisk = d.prediction === 1;
  const score = Math.round(d.risk_score);
  const inp = d.input;
  const f = d.factors;

  resultBox.className = "result " + (highRisk ? "high" : "low");
  badge.className = "badge " + (highRisk ? "bad" : "good");
  badge.textContent = highRisk ? "Stroke Risk Detected" : "Low Stroke Risk";
  title.textContent = highRisk ? "Elevated neural vascular risk" : "Brain health profile looks safer";
  subtitle.textContent = highRisk
    ? `Model probability shows ${score}% stroke risk. Please consult a doctor or neurologist.`
    : `Model probability shows ${score}% stroke risk. Keep protecting your vascular health.`;

  riskFill.style.background = highRisk
    ? "linear-gradient(90deg,#ffb84d,#fb7185)"
    : "linear-gradient(90deg,#2ee6a6,#a78bfa)";
  riskFill.style.width = score + "%";
  riskScore.textContent = score + "%";
  riskScore.style.color = highRisk ? "#fb7185" : "#a78bfa";

  const ageNum = Number(inp.age);
  const glucose = Number(inp.avg_glucose_level);
  const bmiNum = Number(inp.bmi);

  const statItems = [
    ["Age", ageNum + " yrs", ageNum < 45 ? "Younger" : ageNum < 60 ? "Middle-aged" : "Senior", ageNum < 45 ? "good" : ageNum < 60 ? "warn" : "bad"],
    ["Hypertension", inp.hypertension === "1" ? "Yes" : "No", inp.hypertension === "1" ? "Major Risk" : "Clear", inp.hypertension === "1" ? "bad" : "good"],
    ["Heart Disease", inp.heart_disease === "1" ? "Yes" : "No", inp.heart_disease === "1" ? "Risk Factor" : "Clear", inp.heart_disease === "1" ? "bad" : "good"],
    ["Avg Glucose", glucose + " mg/dL", glucose < 140 ? "Normal-ish" : glucose < 200 ? "Elevated" : "High", glucose < 140 ? "good" : glucose < 200 ? "warn" : "bad"],
    ["BMI", bmiNum.toFixed(1), bmiNum < 25 ? "Healthy" : bmiNum < 30 ? "Overweight" : "Obese", bmiNum < 25 ? "good" : bmiNum < 30 ? "warn" : "bad"],
    ["Smoking", inp.smoking_status, inp.smoking_status === "never smoked" ? "Low Risk" : "Review", inp.smoking_status === "never smoked" ? "good" : "warn"],
    ["Residence", inp.Residence_type, "Context", "good"],
    ["Risk Level", d.risk_level, d.risk_level + " Risk", score < 30 ? "good" : score < 70 ? "warn" : "bad"]
  ];

  stats.innerHTML = statItems.map(s => `
    <div class="stat">
      <small>${s[0]}</small>
      <strong>${s[1]}</strong>
      <span class="pill ${statusClass(s[3])}">${s[2]}</span>
    </div>
  `).join("");

  destroy(chartDonut);
  destroy(chartRadar);
  destroy(chartBar);
  destroy(chartVitals);

  chartDonut = new Chart(donut, {
    type: "doughnut",
    data: {
      labels: ["Stroke Risk", "Lower Risk"],
      datasets: [{
        data: [d.probability_yes, d.probability_no],
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
      labels: ["Age", "Glucose", "BMI", "BP History", "Heart Disease", "Smoking"],
      datasets: [{
        data: [
          f.age_score,
          f.glucose_score,
          f.bmi_score,
          f.hypertension_score,
          f.heart_score,
          f.smoking_score
        ],
        backgroundColor: highRisk ? "rgba(251,113,133,.15)" : "rgba(167,139,250,.14)",
        borderColor: highRisk ? "#fb7185" : "#a78bfa",
        pointBackgroundColor: highRisk ? "#fb7185" : "#a78bfa"
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
      labels: ["Age", "Glucose", "BMI", "HTN", "Heart", "Smoke"],
      datasets: [{
        data: [
          f.age_score,
          f.glucose_score,
          f.bmi_score,
          f.hypertension_score,
          f.heart_score,
          f.smoking_score
        ],
        backgroundColor: ["#a78bfa", "#7c3aed", "#60a5fa", "#ffb84d", "#fb7185", "#c4b5fd"],
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

  chartVitals = new Chart(vitals, {
    type: "bar",
    data: {
      labels: ["Age", "Glucose", "BMI"],
      datasets: [{
        label: "Your value",
        data: [ageNum, glucose, bmiNum],
        backgroundColor: ["#a78bfa", "#7c3aed", "#60a5fa"],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { grid: { color: grid }, ticks: { color: chartText } },
        y: { grid: { color: grid }, ticks: { color: chartText } }
      },
      plugins: { legend: { display: false } }
    }
  });

  reports.innerHTML = `
    <div class="report-card">
      <h3>Key Findings</h3>
      <p><b>Hypertension:</b> ${inp.hypertension === "1" ? "Present. This is a major stroke risk factor." : "Not reported."}</p>
      <p><b>Average glucose:</b> ${glucose} mg/dL. ${glucose < 140 ? "This is in a safer range." : glucose < 200 ? "This is elevated and should be monitored." : "This is high and needs medical review."}</p>
      <p><b>BMI:</b> ${bmiNum.toFixed(1)}. ${bmiNum < 25 ? "Healthy range." : bmiNum < 30 ? "Overweight range." : "Obesity range."}</p>
    </div>

    <div class="report-card">
      <h3>Model Output</h3>
      <p><b>Prediction:</b> ${highRisk ? "Stroke risk detected" : "Lower stroke risk"}</p>
      <p><b>Risk level:</b> ${d.risk_level}</p>
      <p><b>Probability:</b> risk ${d.probability_yes}%, lower risk ${d.probability_no}%.</p>
    </div>
  `;

  results.style.display = "block";
  setTimeout(() => results.classList.add("show"), 30);
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}