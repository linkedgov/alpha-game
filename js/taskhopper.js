var LinkedGov = {};
LinkedGov.Taskhopper = function(){
  this.host = "http://localhost:8180";
  this.tasksDone = 0;
  this.currentTaskId = null;
  
  this.getSubmitUrl = function() {
    return this.host + "/task/" + this.currentTaskId + ".js";
  }
  
  this.bind = function(selection) {
    var hopper = this;
    this.activeElement = selection;
    $("body").prepend($('<p id="count"><span>' + this.tasksDone + '</span> changes this session.</p>'));
    $("ul.options").hide();
    
    /* Binds edit button: creates form, handles submit and sends submits data to API. */
    $("li#edit a").click(function() {
      var value = $("div.value span").first().text();
      var taskId = $("div.task").data("task-id");

      var editForm = $('<form method="POST" action="' + hopper.getSubmitUrl() + '" />');
      $('<input name="action" value="edit" type="hidden" />').appendTo(editForm);
      $('<input name="value" type="text" />').val(value).appendTo(editForm);
      $('<br />').appendTo(editForm);
      var submit = $('<input type="submit" value="Send" />');
      submit.appendTo(editForm);

      editForm.submit(function(submit) {
        var editedValue = $(submit.target).find("input[name=value]").val();
        hopper.submitTask(hopper.getSubmitUrl(), {action : "edit", value : editedValue, method: "POST"});
        return false;
      });

      $("div.value span").hide();
      $("div.value").append(editForm);
    });

    /* Binds nullify button to submit to the API. */
    $("li#nullify a").click(function() {
      var taskId = $("div.task").data("task-id");
      var url = this.host + '/task/' + taskId + '.js';
      hopper.submitTask(url, {action : "null", method: "POST"});
    });
    
    /* Binds okay link to submit to the API. */
    $("li#okay a").click(function() {
      hopper.submitTask(hopper.getSubmitUrl(), {action : "okay", method: "POST"});
    });
    
    /* Binds refer to expert link to submit to the API. */
    $("li#refer a").click(function() {
      hopper.submitTask(hopper.getSubmitUrl(), {action : "refer", method: "POST"});
    });

    /* Binds skip link to load another task from the API. */
    $("li#skip a").click(function() {
      $("#task").empty();
      hopper.next();
    });
    
    this.next();
  }
  
  /* Loads next task from the API. */
  this.next = function() {
    this.loadJSONDoc(this.host + "/task/random.js");
  }
  
  /* Submits task back to the API. */
  this.submitTask = function(url, data) {
    var hopper = this;
    $.ajax({url: url,
      data: data,
      dataType: "jsonp",
      type: "GET",
      success: function(data) {
        hopper.thanks();
      },
      error: function(data) {
        hopper.markError();
      }
    });
  }
  
  /* If a task has been submitted without error, thanks user and loads another task. */
  this.thanks = function() {
    var thanksElem = $('<p class="thanks">Thanks!</p>');
    this.activeElement.empty().append(thanksElem);
    thanksElem.delay(500).slideUp(800);
    this.tasksDone = this.tasksDone + 1;
    $("body p#count span").empty().append(this.tasksDone + "");
    this.next();
  }
  
  /* If submitting the task caused an error, gives user an error message and loads another task. */
  this.markError = function() {
    this.activeElement.replaceWith('<p id="task">There\'s been an error.</p>');
    this.next();
  }
  
  /* Loads a task from the taskhopper and modifies the page to show the task. */
  this.loadJSONDoc = function(url) {
    var hopper = this;
    $.ajax({
      url: url,
      dataType: "jsonp",
      success: function(tasks) {
        if (tasks.length == 0) {
          /* If there are no tasks in the array, show the user a thank you message. */
          $("ul.options").hide();
          var out = $("<p>It looks like we haven't got any tasks left! All is now right with the world. Pat yourself on the back.</p>");
          out.appendTo(hopper.activeElement);
        } else {
          /* If there are tasks in the array, bind the first task to the document. */
          var task = tasks[0];
          hopper.currentTaskId = task.id;
          var out = $("<div class=\"task\" />");
          out.data("task-id", task.id);
          
          /* If there is documentation provided with the task, use that. */
          if (task.documentation) {
            if (task.documentation.typeReadable) {
              var introtext = $("<p>We think the value below is a " +
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
          
          /* Once we have constructed the new task display, attach it to the document. */
          out.fadeIn(400);
          $("ul.options").fadeIn(400);
          out.appendTo(hopper.activeElement);
        }
      }
    });
  }
  return this;
} 