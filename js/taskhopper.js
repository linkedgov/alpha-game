$(document).ready(function() {
  $("body").prepend($('<p id="count"><span>0</span> changes this session.</p>'));
  $("ul.options").hide();
  next();

  $("li#nullify a").click(function() {
    var taskId = $("div.task").data("task-id");
    var url = 'http://localhost:8180/task/' + taskId + '.js';
    submitTask(url, {action : "null", method: "POST"});
  });

  $("li#edit a").click(function() {
    var value = $("div.value span").first().text();
    var taskId = $("div.task").data("task-id");

    var editForm = $('<form method="POST" action="http://localhost:8180/task/' + taskId + '.js" />');
    $('<input name="action" value="edit" type="hidden" />').appendTo(editForm);
    $('<input name="value" type="text" />').val(value).appendTo(editForm);
    $('<br />').appendTo(editForm);
    var submit = $('<input type="submit" value="Send" />');
    submit.appendTo(editForm);

    editForm.submit(function(submit) {
      var url = $(submit.target).attr("action");
      var editedValue = $(submit.target).find("input[name=value]").val();
      submitTask(url, {action : "edit", value : editedValue, method: "POST"});
      return false;
    });

    $("div.value span").hide();
    $("div.value").append(editForm);
  });
  
  $("li#okay a").click(function() {
    var taskId = $("div.task").data("task-id");
    var url = 'http://localhost:8180/task/' + taskId + '.js';
    submitTask(url, {action : "okay", method: "POST"});
  });

  $("li#refer a").click(function() {
    var taskId = $("div.task").data("task-id");
    var url = 'http://localhost:8180/task/' + taskId + '.js';
    submitTask(url, {action : "refer", method: "POST"});
  });
});

function submitTask(url, data) {  
  $.ajax({url: url,
    data: data,
    dataType: "jsonp",
    type: "GET",
    success: function(data) {
      thanks();
    },
    error: function(data) {
      markError();
    }
  });
}

function markError() {
  $("#task").replaceWith('<p id="task">There\'s been an error.</p>');
  next();
}

function errorCheckHandler(resp, handle, response) {
  if (errorCheck(resp) == true) {
    handle();
  } else {
    response();
  }
}

function thanks() {
  var thanks = $('<p class="thanks">Thanks!</p>');
  $("#task").empty().append(thanks);
  thanks.delay(500).slideUp(800);
  var counts = parseInt($("body p#count span").text()) + 1;
  $("body p#count span").empty().append(counts + "");
  next();
}

function next() {
  loadJSONDoc("http://localhost:8180/task/random.js", "#task");
}

function loadJSONDoc(url, selector) {
  $.ajax({
    url: url,
    dataType: "jsonp",
    success: function(tasks) {
      var task = tasks[0];
      var out = $("<div class=\"task\" />");
      out.data("task-id", task.id);
      
      if (task.documentation) {
        if (task.documentation.typeReadable) {
          var introtext = $("<p>We this the value below is a " +
              task.documentation.typeReadable +
              ", but we need confirmation.</p><p>Can you help? Could you make it to be the same format as the examples provided?</p>");
          introtext.appendTo(out);
        }
      } else {
        var introtext = $("<p>We have data we are unsure about. Can you spot what is wrong with it and fix it to make it similar to the examples provided?</p>");
        introtext.appendTo(out);
      }
      
      if (task.brokenValue) {
        var value = $('<div class="value"><span>' + task.brokenValue.value + '</span></div>');
        value.appendTo(out);
      }

      if (task.example) {
        var examples = $('<ul class="example" />');
        for (i = 0; i < task.example.length; i++) {
          $("<li />").text(task.example[i]).appendTo(examples);
        }
        examples.appendTo(out);
      }
      out.fadeIn(400);
      $("ul.options").fadeIn(400);
      out.appendTo(selector);
    }
  });
}
