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

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

// Adding the function to check due dates and change bg color of cards
var auditTask = function (taskEl) {
  // get date from task element
  var date = $(taskEl).find("span").text().trim();

  // convert to moment object at 5:00pm
  var time = moment(date, "L").set("hour", 17);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger");
  } else if (Math.abs(moment().diff(time, "days")) <= 2) {
    $(taskEl).addClass("list-group-item-warning");
  }
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

  $(this).replaceWith(dateInput);

  // enable jquery ui datepicker
  dateInput.datepicker({
    minDate: 1,
    onClose: function () {
      // when calendar is closed, force a "change" to date to revert back to original (this)
      $(this).trigger("change");
    },
  });

  // automatically bring up the calendar
  dateInput.trigger("focus");
});

// value of due date was changed and neeeds to be changed back to a non editable element. we now use on change event listener since we are using the datepicker as opposed to blur when we typed the date in manually.
$(".list-group").on("change", "input[type='text']", function () {
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

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"));
});

//adding sortable from jQuery UI to allow dragging and droping of ul elements with class list-group
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event, ui) {
    $(this).addClass("dropover");
    $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function (event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function (event) {
    $(event.target).addClass("dropover-active");
  },
  out: function (event) {
    $(event.target).removeClass("dropover-active");
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
    // remove dragged element from the dom
    ui.draggable.remove();
    $(".bottom-trash").removeClass("bottom-trash-active"); //draggable is "a jQuery object representing the draggable element. Allows us to track which item is being dragged and dropped in trash
  },
  over: function (event, ui) {
    $(".bottom-trash").addClass("bottom-trash-active");
  },
  out: function (event, ui) {
    $(".bottom-trash").removeClass("bottom-trash-active");
  },
});

//Adding date picker to modal input date field using jquery ui datepicker
$("#modalDueDate").datepicker({
  //using minDate to set how many days after the current date we want the limit to kick in.
  minDate: 1,
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

//Set interval to run audit on task ever 30 mins
setInterval(function () {
  $(".card .list-group-item").each(function (index, el) {
    auditTask(el);
  });
}, 1000 * 60 * 30);
