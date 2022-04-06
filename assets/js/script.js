var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    //console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};
// Adding the ability to edit task=============
//this code get the <p> tag ie.documentQuerySelector(p) but in jQuery the p tag is delegated
$(".list-group").on("click", "p", function () {
  //assigns the tag and innerhtml to text and .text() takes only the textcontnent and .trim removes the white spaces before and after
  var text = $(this).text().trim();
  console.log(text);
  // textInput is assignd a textarea for tag,assigned a class and text is added as its value
  var textInput = $("<textarea>").addClass("form-control").val(text);
  //.replaceWith changes the above p tag to the textarea so we can edit the task.
  $(this).replaceWith(textInput);
  textInput.trigger("focus");
});

$(".list-group").on("blur", "textarea", function () {
  // get the textarea's current value/text
  var text = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();

  // recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);

  // replace textarea with p element
  $(this).replaceWith(taskP);
});

// Adding the ability to edit due date=============
// due date was clicked
$(".list-group").on("click", "span", function () {
  // get current text
  var date = $(this).text().trim();

  // create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  // swap out elements
  $(this).replaceWith(dateInput);

  // automatically focus on new element
  dateInput.trigger("focus");
});

// value of due date was changed and neeeds to be changed back to a no editable element
$(".list-group").on("blur", "input[type='text']", function () {
  // get current text
  var date = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);
});

//adding sortable from jQuery UI to allow dragging and droping of ul elements with class list-group
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    console.log("activate", this);
  },
  deactivate: function (event) {
    console.log("deactivate", this);
  },
  over: function (event) {
    console.log("over", event.target);
  },
  out: function (event) {
    console.log("out", event.target);
  },
  update: function (event) {
    // array to store the task data in
    var tempArr = [];

    // loop over current set of children in sortable list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();

        var date = $(this).find("span").text().trim();

        // add task data to the temp array as an object
        tempArr.push({
          text: text,
          date: date,
        });
      });
    console.log(tempArr);

    // trim down list's ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");

    // update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
  },
});
/**helper: "clone" that tells jQuery to create a copy of the dragged element and move the copy instead of the original. This is necessary to prevent click events from accidentally triggering on the original element. We also added several event listeners like activate, over, and out. 
The children() method returns an array of the list element's children (the <li> elements, labeled as li.list-group-item). No coincidence, tasks are saved in localStorage as an array. The order of these <li> elements and the indexes in the task arrays should match one-to-one. This means we just need to loop over the elements, pushing their text values into a new tasks array.
jQuery's each() method will run a callback function for every item/element in the array. It's another form of looping, except that a function is now called on each loop iteration. The potentially confusing part of this code is the second use of $(this). Inside the callback function, $(this) actually refers to the child element at that index.
These values ultimately need to go in an array. Let's declare a new array before the looping starts. Then instead of console logging the values in the loop, we'll combine them into an object and push this object into the array.
he next step is to use the tempArr array to overwrite what's currently saved in the tasks object. We're dealing with multiple lists, though, not just toDo. How do we know when to update tasks.toDo versus tasks.inReview or tasks.done?

We solved a similar problem earlier in the project when dealing with blur events. Each list has an id attribute that matches a property on tasks. For instance: id="list-inReview". We'll use the same approach here to get the list's ID and update the corresponding array on tasks. 
* 
*/

// Adding drag to trash using jQuery UI
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    console.log("drop");
    ui.draggable.remove(); //draggable is "a jQuery object representing the draggable element. Allows us to track which item is being dragged and dropped in trash
  },
  over: function (event, ui) {
    console.log("over");
  },
  out: function (event, ui) {
    console.log("out");
  },
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();
