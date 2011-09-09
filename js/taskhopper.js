$(document).ready(function() {
  $("body").prepend($('<p id="count"><span>0</span> changes this session.</p>'));
  $("ul.options").hide();
  next();

  $("li#nullify a").click(function() {
    nullify();
  });

  $("li#edit a").click(function() {
    var value = $("div.value span").first().text();
    var taskId = $("div#task").data("task-id");

    var editForm = $('<form method="POST" action="/task/' + taskId + '" />');
    $('<input name="action" value="edit" type="hidden" />').appendTo(editForm);
    $('<input name="value" type="text" />').val(value).appendTo(editForm);
    $('<br />').appendTo(editForm);
    var submit = $('<input type="submit" value="Send" />');
    submit.appendTo(editForm);

    editForm.submit(function(submit) {
      thanks();
      return false;
    });

    $("div.value span").hide();
    $("div.value").append(editForm);
  });
  
  $("li#okay a").click(function() {
    $.get(
      "http://localhost:8000/mock/okay.xml",
      null,
      function(resp) {
        var response = $(resp);
        errorCheckHandler(resp, markError, thanks);
      },
      "xml");
  });

  $("li#refer a").click(function() {
    $.get(
      "http://localhost:8000/mock/refer.xml",
      null,
      function(resp) {
        var response = $(resp);
        errorCheckHandler(resp, markError, thanks);
      },
      "xml");
  });
});

function nullify() {
  $.get(
    "http://localhost:8000/mock/nullified.xml",
    null,
    function(resp) {
      var response = $(resp);
      errorCheckHandler(resp, markError, thanks);
    },
    "xml"
  );
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
  loadJSONDoc("http://localhost:8000/mock/doc.json", "#task");
}

function errorCheck(resp) {
  // check to see if it's been parsed into jQuery
  if (!resp.find) {
    var response = $(resp);
  } else {
    var response = resp;
  }
  var errorCheck = false;
  // change to true if errors are more than zero
  if (response.find("error").size() != 0) {
    errorCheck = true;
  }
  return errorCheck;
}

function loadJSONDoc(url, selector) {
  $.getJSON(url, null, function(task) {
    var out = $("<div class=\"task\" />");
    out.data("task-id", task.id);
    
    var introtext = $("<p>We this the value below is a " + task.documentation.typeReadable + ", but we need confirmation.</p><p>Can you help? Could you make it to be the same format as the examples provided?</p>");
    introtext.appendTo(out);

    var value = $('<div class="value"><span>' + task.brokenValue.value + '</span></div>');
    value.appendTo(out);
    
    var examples = $('<ul class="example" />').data("type", task.example.type);
    for (i = 0; i < task.example.values.length; i++) {
      $("<li />").text(task.example.values[i]).appendTo(examples);
    }
    examples.appendTo(out);
    out.fadeIn(400);
    $("ul.options").fadeIn(400);
    out.appendTo(selector);
  });
}
