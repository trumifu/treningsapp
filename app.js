/* =========================================================
   TRENINGSAPP
   Lokal treningsdagbok
   ========================================================= */


/* ---------- DATA ---------- */

let data = {
    exercises: [],
    programs: [],
    workouts: []
};

let activeWorkout = null;


/* ---------- LOCAL STORAGE ---------- */

function saveData() {
    localStorage.setItem("trainingAppData", JSON.stringify(data));
}

function loadData() {

    const saved = localStorage.getItem("trainingAppData");

    if (saved) {
        try {
            data = JSON.parse(saved);
        } catch {
            data = {
                exercises: [],
                programs: [],
                workouts: []
            };
        }
    }

    if (!data.exercises) data.exercises = [];
    if (!data.programs) data.programs = [];
    if (!data.workouts) data.workouts = [];
}


/* ---------- NAVIGATION ---------- */

const navButtons = document.querySelectorAll(".nav-button");
const screens = document.querySelectorAll(".screen");

navButtons.forEach(button => {

    button.addEventListener("click", () => {

        showScreen(button.dataset.screen);

    });

});


function showScreen(screenId) {

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }

    navButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.screen === screenId
        );
    });

    renderAll();
}


/* ---------- MODAL ---------- */

function openModal(title, content) {

    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = content;

    document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
}


/* ---------- HELPERS ---------- */

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substring(2);
}


function escapeHtml(value) {

    if (value === undefined || value === null) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getTodayName() {

    const days = [
        "søndag",
        "mandag",
        "tirsdag",
        "onsdag",
        "torsdag",
        "fredag",
        "lørdag"
    ];

    return days[new Date().getDay()];
}


function formatDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("no-NO", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


function formatShortDate(dateString) {

    const date = new Date(dateString);

    return date.toLocaleDateString("no-NO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


/* ---------- TODAY ---------- */

function renderToday() {

    const today = getTodayName();

    const dateElement = document.getElementById("today-date");

    dateElement.textContent =
        new Date().toLocaleDateString("no-NO", {
            weekday: "long",
            day: "numeric",
            month: "long"
        });


    const programs = data.programs.filter(
        program => program.day === today
    );

    const container = document.getElementById("today-content");


    if (programs.length === 0) {

        container.innerHTML = `
            <div class="empty">
                <h3>Ingen trening planlagt</h3>
                <p>
                    Du har ikke lagt inn et program for ${today}.
                </p>

                <button class="primary-button"
                    onclick="showScreen('programs-screen')">
                    GÅ TIL PROGRAMMER
                </button>
            </div>
        `;

        return;
    }


    container.innerHTML = programs.map(program => {

        const exerciseCount = program.exerciseIds.length;

        return `
            <div class="card">

                <span class="program-day">${escapeHtml(program.day)}</span>

                <h3>${escapeHtml(program.name)}</h3>

                <p>
                    ${exerciseCount}
                    ${exerciseCount === 1 ? "øvelse" : "øvelser"}
                </p>

                <button class="primary-button"
                    onclick="startWorkout('${program.id}')">
                    START ØKT
                </button>

            </div>
        `;

    }).join("");
}


/* ---------- PROGRAMS ---------- */

function renderPrograms() {

    const container = document.getElementById("program-list");

    if (data.programs.length === 0) {

        container.innerHTML = `
            <div class="empty">
                <h3>Ingen programmer ennå</h3>
                <p>Trykk + for å lage ditt første program.</p>
            </div>
        `;

        return;
    }


    container.innerHTML = data.programs.map(program => {

        const exercises = program.exerciseIds
            .map(id => data.exercises.find(e => e.id === id))
            .filter(Boolean);


        return `
            <div class="program-card">

                <div class="program-card-header">

                    <div>

                        <span class="program-day">
                            ${escapeHtml(program.day)}
                        </span>

                        <h3>
                            ${escapeHtml(program.name)}
                        </h3>

                    </div>

                    <button class="danger-button"
                        onclick="deleteProgram('${program.id}')">
                        Slett
                    </button>

                </div>


                <ol class="program-exercises">

                    ${
                        exercises.length
                        ?
                        exercises.map(exercise =>
                            `<li>${escapeHtml(exercise.name)}</li>`
                        ).join("")
                        :
                        "<li>Ingen øvelser</li>"
                    }

                </ol>


                <button class="primary-button"
                    onclick="startWorkout('${program.id}')">
                    START ØKT
                </button>

            </div>
        `;

    }).join("");
}


/* ---------- CREATE PROGRAM ---------- */

function openProgramForm() {

    if (data.exercises.length === 0) {

        openModal(
            "Lag program",
            `
            <div class="empty">
                <h3>Du trenger noen øvelser først</h3>
                <p>
                    Lag minst én øvelse før du lager et program.
                </p>

                <button class="primary-button"
                    onclick="closeModal(); openExerciseForm();">
                    + LAG ØVELSE
                </button>
            </div>
            `
        );

        return;
    }


    const days = [
        "mandag",
        "tirsdag",
        "onsdag",
        "torsdag",
        "fredag",
        "lørdag",
        "søndag"
    ];


    openModal(
        "Nytt program",
        `

        <div class="form-group">

            <label>Programnavn</label>

            <input
                id="program-name"
                type="text"
                placeholder="F.eks. Bryst & triceps"
            >

        </div>


        <div class="form-group">

            <label>Dag</label>

            <select id="program-day">

                ${days.map(day =>
                    `<option value="${day}">
                        ${day.charAt(0).toUpperCase() + day.slice(1)}
                    </option>`
                ).join("")}

            </select>

        </div>


        <div class="form-group">

            <label>Øvelser</label>

            <div class="checkbox-list">

                ${data.exercises.map(exercise => `

                    <label class="checkbox-item">

                        <input
                            type="checkbox"
                            value="${exercise.id}"
                            class="program-exercise"
                        >

                        <span>
                            ${escapeHtml(exercise.name)}
                        </span>

                    </label>

                `).join("")}

            </div>

        </div>


        <button class="primary-button"
            onclick="saveProgram()">
            LAGRE PROGRAM
        </button>

        `
    );
}


function saveProgram() {

    const name =
        document.getElementById("program-name").value.trim();

    const day =
        document.getElementById("program-day").value;

    const exerciseIds =
        [...document.querySelectorAll(".program-exercise:checked")]
            .map(input => input.value);


    if (!name) {
        alert("Skriv inn et navn på programmet.");
        return;
    }


    if (exerciseIds.length === 0) {
        alert("Velg minst én øvelse.");
        return;
    }


    data.programs.push({

        id: generateId(),

        name,

        day,

        exerciseIds

    });


    saveData();

    closeModal();

    renderAll();
}


function deleteProgram(id) {

    if (!confirm("Vil du slette dette programmet?")) {
        return;
    }

    data.programs =
        data.programs.filter(program => program.id !== id);

    saveData();

    renderAll();
}


/* ---------- EXERCISES ---------- */

function renderExercises() {

    const container = document.getElementById("exercise-list");


    if (data.exercises.length === 0) {

        container.innerHTML = `
            <div class="empty">

                <h3>Ingen øvelser ennå</h3>

                <p>
                    Lag dine egne øvelser med bilde og beskrivelse.
                </p>

            </div>
        `;

        return;
    }


    container.innerHTML = data.exercises.map(exercise => {

        return `
            <div class="exercise-card">

                <div class="exercise-card-header">

                    <h3>
                        ${escapeHtml(exercise.name)}
                    </h3>

                    <button class="danger-button"
                        onclick="deleteExercise('${exercise.id}')">
                        Slett
                    </button>

                </div>


                ${
                    exercise.image
                    ?
                    `<img src="${exercise.image}" alt="">`
                    :
                    ""
                }


                ${
                    exercise.description
                    ?
                    `<div class="exercise-description">
                        ${escapeHtml(exercise.description)}
                    </div>`
                    :
                    `<p>Ingen beskrivelse.</p>`
                }

            </div>
        `;

    }).join("");
}


/* ---------- CREATE EXERCISE ---------- */

function openExerciseForm() {

    openModal(
        "Ny øvelse",
        `

        <div class="form-group">

            <label>Navn</label>

            <input
                id="exercise-name"
                type="text"
                placeholder="F.eks. Benkpress"
            >

        </div>


        <div class="form-group">

            <label>Beskrivelse</label>

            <textarea
                id="exercise-description"
                placeholder="Beskriv hvordan øvelsen utføres..."
            ></textarea>

        </div>


        <div class="form-group">

            <label>Bilde</label>

            <input
                id="exercise-image"
                type="file"
                accept="image/*"
            >

        </div>


        <button class="primary-button"
            onclick="saveExercise()">
            LAGRE ØVELSE
        </button>

        `
    );
}


function saveExercise() {

    const name =
        document.getElementById("exercise-name").value.trim();

    const description =
        document.getElementById("exercise-description").value.trim();

    const file =
        document.getElementById("exercise-image").files[0];


    if (!name) {
        alert("Skriv inn navn på øvelsen.");
        return;
    }


    if (file) {

        const reader = new FileReader();

        reader.onload = function(event) {

            createExercise(
                name,
                description,
                event.target.result
            );

        };

        reader.readAsDataURL(file);

    } else {

        createExercise(
            name,
            description,
            null
        );

    }
}


function createExercise(name, description, image) {

    data.exercises.push({

        id: generateId(),

        name,

        description,

        image

    });


    saveData();

    closeModal();

    renderAll();
}


function deleteExercise(id) {

    const usedByProgram =
        data.programs.some(program =>
            program.exerciseIds.includes(id)
        );


    if (usedByProgram) {

        alert(
            "Denne øvelsen brukes i et program. " +
            "Fjern den fra programmet først."
        );

        return;
    }


    if (!confirm("Vil du slette denne øvelsen?")) {
        return;
    }


    data.exercises =
        data.exercises.filter(exercise => exercise.id !== id);


    saveData();

    renderAll();
}


/* ---------- WORKOUT ---------- */

function startWorkout(programId) {

    const program =
        data.programs.find(p => p.id === programId);


    if (!program) {
        return;
    }


    activeWorkout = {

        id: generateId(),

        programId: program.id,

        programName: program.name,

        date: new Date().toISOString(),

        exercises: []

    };


    program.exerciseIds.forEach(exerciseId => {

        const exercise =
            data.exercises.find(e => e.id === exerciseId);


        if (!exercise) {
            return;
        }


        const previous =
            getLastExercisePerformance(exerciseId);


        const suggested =
            getSuggestion(previous);


        activeWorkout.exercises.push({

            exerciseId: exercise.id,

            exerciseName: exercise.name,

            sets: suggested.map(set => ({

                weight: set.weight,

                reps: set.reps

            }))

        });

    });


    renderWorkout();

    showScreen("workout-screen");
}


function getLastExercisePerformance(exerciseId) {

    for (let i = data.workouts.length - 1; i >= 0; i--) {

        const workout = data.workouts[i];

        const exercise =
            workout.exercises.find(
                e => e.exerciseId === exerciseId
            );


        if (exercise && exercise.sets.length > 0) {

            return exercise.sets;

        }

    }


    return [];
}


function getSuggestion(previousSets) {

    if (!previousSets || previousSets.length === 0) {

        return [
            {
                weight: "",
                reps: ""
            }
        ];

    }


    return previousSets.map(set => ({

        weight: set.weight ?? "",

        reps: set.reps ?? ""

    }));


}


/* ---------- RENDER WORKOUT ---------- */

function renderWorkout() {

    if (!activeWorkout) {
        return;
    }


    document.getElementById("workout-title").textContent =
        activeWorkout.programName;


    const container =
        document.getElementById("workout-exercises");


    container.innerHTML =
        activeWorkout.exercises.map(
            (exercise, exerciseIndex) => {


            const previous =
                getLastExercisePerformance(
                    exercise.exerciseId
                );


            const suggestionText =
                previous.length
                ?
                previous
                    .map(set =>
                        `${set.weight || "-"} kg × ${set.reps || "-"}`
                    )
                    .join(" • ")
                :
                "Ingen tidligere økt";


            return `

                <div class="workout-exercise">

                    <h3>
                        ${escapeHtml(exercise.exerciseName)}
                    </h3>


                    <div class="last-session">

                        <strong>Sist gang:</strong><br>

                        ${escapeHtml(suggestionText)}

                    </div>


                    <div class="suggestion">
                        Forslag: bruk forrige økt som utgangspunkt
                    </div>


                    <div class="sets-container"
                        id="sets-${exerciseIndex}">

                        ${renderSetRows(
                            exercise,
                            exerciseIndex
                        )}

                    </div>


                    <button class="add-set"
                        onclick="addSet(${exerciseIndex})">

                        + Legg til sett

                    </button>

                </div>

            `;

        }).join("");
}


function renderSetRows(exercise, exerciseIndex) {

    return exercise.sets.map(
        (set, setIndex) => `

        <div class="set-row">

            <div class="set-number">
                ${setIndex + 1}
            </div>

            <input
                type="number"
                step="0.5"
                placeholder="kg"
                value="${escapeHtml(set.weight)}"
                onchange="updateSet(
                    ${exerciseIndex},
                    ${setIndex},
                    'weight',
                    this.value
                )"
            >

            <input
                type="number"
                placeholder="reps"
                value="${escapeHtml(set.reps)}"
                onchange="updateSet(
                    ${exerciseIndex},
                    ${setIndex},
                    'reps',
                    this.value
                )"
            >

            <button
                class="remove-set"
                onclick="removeSet(
                    ${exerciseIndex},
                    ${setIndex}
                )">

                ×

            </button>

        </div>

    `).join("");
}


function updateSet(
    exerciseIndex,
    setIndex,
    property,
    value
) {

    activeWorkout.exercises[
        exerciseIndex
    ].sets[
        setIndex
    ][property] = value;

}


function addSet(exerciseIndex) {

    activeWorkout.exercises[
        exerciseIndex
    ].sets.push({

        weight: "",

        reps: ""

    });


    renderWorkout();
}


function removeSet(exerciseIndex, setIndex) {

    const sets =
        activeWorkout.exercises[
            exerciseIndex
        ].sets;


    if (sets.length <= 1) {
        return;
    }


    sets.splice(setIndex, 1);

    renderWorkout();
}


/* ---------- FINISH WORKOUT ---------- */

function finishWorkout() {

    if (!activeWorkout) {
        return;
    }


    activeWorkout.exercises =
        activeWorkout.exercises.map(exercise => ({

            ...exercise,

            sets: exercise.sets.filter(
                set =>
                    set.weight !== "" ||
                    set.reps !== ""
            )

        })).filter(
            exercise => exercise.sets.length > 0
        );


    if (activeWorkout.exercises.length === 0) {

        alert("Du har ikke registrert noen sett.");

        return;
    }


    data.workouts.push(activeWorkout);

    saveData();


    alert("Økten er lagret! 💪");


    activeWorkout = null;


    showScreen("today-screen");
}


function confirmExitWorkout() {

    if (
        confirm(
            "Vil du avslutte økten uten å lagre?"
        )
    ) {

        activeWorkout = null;

        showScreen("today-screen");

    }

}


/* ---------- HISTORY ---------- */

function renderHistory() {

    const container =
        document.getElementById("history-list");


    if (data.workouts.length === 0) {

        container.innerHTML = `
            <div class="empty">

                <h3>Ingen historikk ennå</h3>

                <p>
                    Fullfør din første treningsøkt
                    for å se historikken her.
                </p>

            </div>
        `;

        return;
    }


    const workouts =
        [...data.workouts].reverse();


    container.innerHTML =
        workouts.map(workout => `

            <div class="history-item">

                <h3>
                    ${escapeHtml(workout.programName)}
                </h3>

                <p>
                    ${formatDate(workout.date)}
                </p>


                ${workout.exercises.map(exercise => `

                    <div>

                        <strong>
                            ${escapeHtml(exercise.exerciseName)}
                        </strong>

                        <div>

                            ${exercise.sets.map(set => `

                                <span class="history-set">
                                    ${escapeHtml(set.weight)}
                                    kg ×
                                    ${escapeHtml(set.reps)}
                                </span>

                            `).join("")}

                        </div>

                    </div>

                `).join("<hr>")}

            </div>

        `).join("");
}


/* ---------- RENDER EVERYTHING ---------- */

function renderAll() {

    renderToday();

    renderPrograms();

    renderExercises();

    renderHistory();

}


/* ---------- INITIALIZE ---------- */

loadData();

renderAll();