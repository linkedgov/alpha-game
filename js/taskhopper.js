/* TaskHopper API object definition.
 *
 */
var LinkedGov = {};
LinkedGov.Taskhopper = function(){
  /* Set host to the hostname of the API server. */
  this.host = "http://localhost:8180";

  /* tasksDone is the number of tasks the user has done. It gets increased by the thanks method below. */
  this.tasksDone = 0;

  /* After a task is loaded, this gets set to the ID of the current task. */
  this.currentTaskId = null;
  
  /* Constructs the submit URL. */
  this.getSubmitUrl = function() {
    return this.host + "/task/" + this.currentTaskId + ".js";
  }
  
  /* Binding method constructs the edit form and binds event handlers to the response buttons. */
  this.bind = function(selection) {
    var hopper = this;
    this.activeElement = selection;
    /* Construct the 'tasks done' counter. */
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

      /* Bind submission of edit form to API. */
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
      hopper.submitTask(hopper.getSubmitUrl(), {action : "null", method: "POST"});
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
  
  /* Loads next task from the API.
   * This gets a random task from the server, and the loadJSONDoc method then handles
   * the response from the API to construct a new form. */
  this.next = function() {
    this.loadJSONDoc(this.host + "/task/random.js");
  }
  
  /* Submits task back to the API. If successful, the user is thanked and another
   * task is loaded. If the submit back to the server fails, we warn the user there
   * has been an error then load another task.
   */
  this.submitTask = function(url, data) {
    var hopper = this;
    $.ajax({url: url,
      data: data,
      dataType: "jsonp",
      type: "GET",
      success: function(data) {
        /* The data variable here contains details about the individual data
         * instance (row, basically) in RDF/JSON format.  If you want to
         * present the data to the user after completing the task, you can do
         * that with this data. It also includes other issues with the
         * instance.
         */
        hopper.thanks();
      },
      error: function(data) {
        hopper.markError();
      }
    });
  }
  
  /* If a task has been submitted without error, thanks user and loads another
   * task. */
  this.thanks = function() {
    /* Construct HTML to thank the user. */
    var thanksElem = $('<p class="thanks">Thanks!</p>');
    this.activeElement.empty().append(thanksElem);
    thanksElem.delay(500).slideUp(800);
    /* Update the number of tasks done. */
    this.tasksDone = this.tasksDone + 1;
    $("body p#count span").empty().append(this.tasksDone + "");
    /* Load the next task. */
    this.next();
  }
  
  /* If submitting the task caused an error, gives user an error message and
   * loads another task. */
  this.markError = function() {
    this.activeElement.replaceWith('<p id="task">There\'s been an error.</p>');
    this.sendError();
    this.next();
  }
  
  /* If there is an issue with processing data, send a message back to the
   * server. */
  this.sendError = function() {
    var hopper = this;
    $.ajax({ url: hopper.host + "/task/problem.js", dataType: "jsonp" });
  }
  
  /* Loads a task from the taskhopper and constructs a view of the data for
   * the user. */
  this.loadJSONDoc = function(url) {
    var hopper = this;
    $.ajax({
      url: url,
      dataType: "jsonp",
      success: function(response) {

        /* If there is a task available, we will get back JSON from the server.
         *
         * The JSON contains the URLs of the issue, the instance ('graph'), the task type,
         * the broken value, the dataset and (usually) some example data.
         *
         * Below, we have parse that data and construct a display for the user. Specifically, we need to use the 
         */

        var tasks = response.rsp;
        if (tasks.length == 0) {
          /* There are no tasks left in the taskhopper, so we can give them a nice
           * thank you message! */
          $("ul.options").hide();
          var out = $("<p>It looks like we haven't got any tasks left! All is now right with the world. Pat yourself on the back.</p>");
          out.appendTo(hopper.activeElement);
        } else {
          /* If there are tasks in the array, bind the first task to the document. */
          var task = tasks[0];

          /* We set the currentTaskId of the object to the ID returned by the
           * API. This is important as we use it later for constructing the URL
           * we submit back to. */
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
          
          /* Add the broken value to the view. */
          if (task.brokenValue) {
            var value = $('<div class="value"><span>' + task.brokenValue.value + '</span></div>');
            value.appendTo(out);
          }
          
          /* Add the example values to the view. */
          if (task.example) {
            var examples = $('<ul class="example" />');
            for (i = 0; i < task.example.length; i++) {
              $("<li />").text(task.example[i]).appendTo(examples);
            }
            examples.appendTo(out);
          }
          
          /* Once we have constructed the new task display, attach it to the
           * document and display it to the user. */
          out.fadeIn(400);
          $("ul.options").fadeIn(400);
          out.appendTo(hopper.activeElement);
        }
      },

      /* If there is an error, handle it with an error message, then try loading a task again. */
      error: function(data) {
        hopper.markError();
      }
    });
  }
  return this;
} 
