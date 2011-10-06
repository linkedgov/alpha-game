/* TaskHopper API object definition.
 * 
 * This defines a set of reusable functions which construct a basic game and show how the
 * LinkedGov TaskHopper API works to retrieve tasks and fix problems in data.
 * 
 * To see how the game is invoked, check index.html
 * 
 * At certain points in the code, because of scoping, 'gameObjectRef' is set and used to refer
 * to the game object overall.
 */
var LinkedGov = {};
LinkedGov.Taskhopper = function(){
  /* Set host to the hostname of the API server. */
  this.host = "http://localhost:8180";

  /* tasksDone is the number of tasks the user has done. It gets increased by the thanks method below. */
  this.tasksDone = 0;

  /* After a task is loaded, this gets set to the ID of the current task. */
  this.currentTaskId = null;

  /* Sets the task type you want to do. If null, it requests tasks of all type. */
  this.taskType = null;
  
  /* Number of times to try loading a task if broken. */
  this.limitAttempts = 5;
  this.attempts = 0;
  
  /* Constructs the submit URL. */
  this.getSubmitUrl = function() {
    return this.host + "/task/" + this.currentTaskId + ".js";
  }
  
  /* Binding method constructs the edit form and binds event handlers to the response buttons. */
  this.bind = function(selection) {
    this.activeElement = selection;
    var gameObjectRef = this;
    /* Construct the 'tasks done' counter. */
    selection.prepend($('<p id="count"><span>' + this.tasksDone + '</span> changes this session.</p>'));
    selection.find("ul.options").hide();
    
    /* Binds edit button: creates form, handles submit and sends submits data to API. */
    gameObjectRef.activeElement.find("li#edit a").click(function() {
      var value = gameObjectRef.activeElement.find("div.value span").first().text();
      var taskId = gameObjectRef.activeElement.find("div.game").data("task-id");

      var editForm = $('<form method="POST" action="' + gameObjectRef.getSubmitUrl() + '" />');
      $('<input name="action" value="edit" type="hidden" />').appendTo(editForm);
      $('<input name="value" type="text" />').val(value).appendTo(editForm);
      $('<br />').appendTo(editForm);
      var submit = $('<input type="submit" value="Send" />');
      submit.appendTo(editForm);

      /* Bind submission of edit form to API. */
      editForm.submit(function(submit) {
        var editedValue = $(submit.target).find("input[name=value]").val();
        gameObjectRef.submitTask(gameObjectRef.getSubmitUrl(), {action : "edit", value : editedValue, method: "POST"});
        return false;
      });

      gameObjectRef.activeElement.find("div.value span").hide();
      gameObjectRef.activeElement.find("div.value").append(editForm);
    });

    /* Binds nullify button to submit to the API. */
    gameObjectRef.activeElement.find("li#nullify a").click(function() {
      gameObjectRef.submitTask(gameObjectRef.getSubmitUrl(), {action : "null", method: "POST"});
    });
    
    /* Binds okay link to submit to the API. */
    gameObjectRef.activeElement.find("li#okay a").click(function() {
      gameObjectRef.submitTask(gameObjectRef.getSubmitUrl(), {action : "okay", method: "POST"});
    });
    
    /* Binds refer to expert link to submit to the API. */
    gameObjectRef.activeElement.find("li#refer a").click(function() {
      gameObjectRef.submitTask(gameObjectRef.getSubmitUrl(), {action : "refer", method: "POST"});
    });

    /* Binds skip link to load another task from the API. */
    gameObjectRef.activeElement.find("li#skip a").click(function() {
      $(gameObjectRef.activeElement).find(".game").empty();
      gameObjectRef.next();
    });
    
    this.next();
  }
  
  /* Loads next task from the API.
   * This gets a random task from the server, and the loadJSONDoc method then handles
   * the response from the API to construct a new form. */
  this.next = function() {
    if (this.taskType == null) {
      this.loadJSONDoc(this.host + "/task/random.js");
    } else {
      /* If a task type has been set, we load that type of task. */
      this.loadJSONDoc(this.host + "/task/random.js?type=" + encodeURIComponent(this.taskType));
    }
  }
  
  /* Submits task back to the API. If successful, the user is thanked and another
   * task is loaded. If the submit back to the server fails, we warn the user there
   * has been an error then load another task.
   */
  this.submitTask = function(url, data) {
    var gameObjectRef = this;
    $.ajax({url: url,
      dataType: "jsonp",
      data: data,
      type: "GET",
      success: function(data) {
        console.log(data);
        /* The data variable here contains details about the individual data
         * instance (row, basically) in RDF/JSON format.  If you want to
         * present the data to the user after completing the task, you can do
         * that with this data. It also includes other issues with the
         * instance.
         */
        gameObjectRef.thanks();
      },
      error: function(data) {
        gameObjectRef.markError();
      }
    });
  }
  
  /* If a task has been submitted without error, thanks user and loads another
   * task. */
  this.thanks = function() {
    /* Construct HTML to thank the user. */
    var thanksElem = $('<p class="thanks">Thanks!</p>');
    this.activeElement.find(".game").empty().append(thanksElem);
    thanksElem.delay(500).slideUp(800);
    /* Update the number of tasks done. */
    this.tasksDone = this.tasksDone + 1;
    this.activeElement.find("p#count span").empty().append(this.tasksDone + "");
    /* Load the next task. */
    this.next();
  }
  
  /* If submitting the task caused an error, gives user an error message and
   * loads another task. */
  this.markError = function(msg) {
    /* Construct HTML to thank the user. */
    if (msg == null || msg == "") {
      var thanksElem = $('<p class="problem">There\'s been a problem.</p>');
    } else {
      var thanksElem = $('<p class="problem">' + msg + '</p>');
    }
    this.activeElement.find(".game").empty().append(thanksElem);
    thanksElem.delay(3000).slideUp(800);
    
    this.sendError();
    /* Increment the number of errors we've had. */
    this.attempts = this.attempts + 1;
    /* Try again, unless we've had too many errors. */
    if (this.attempts < this.limitAttempts) {
      this.next();
    } else {
      this.activeElement.replaceWith('<p class="fatal">Lost connection to server: please reload the page.</p>');
    }
  }
  
  /* If there is an issue with processing data, send a message back to the
   * server. */
  this.sendError = function() {
    var gameObjectRef = this;
    $.ajax({ url: gameObjectRef.host + "/task/problem.js", dataType: "jsonp" });
  }
  
  /* Loads a task from the taskhopper and constructs a view of the data for
   * the user. */
  this.loadJSONDoc = function(url, data) {
    var gameObjectRef = this;
    $.ajax({
      url: url,
      data: data,
      dataType: "jsonp",
      success: function(response) {

        /* If there is a task available, we will get back JSON from the server.
         *
         * The JSON contains the identifier (as a URL) of the type of the task,
         * the value that needs fixing, and (usually) some examples of valid
         * values, and other data that might be helpful about the record where
         * the task comes from.
         *
         * Below, we have parse that data and construct a display for the user.
         * Specifically, we need to use the 
         */

        var tasks = response.rsp;
        if (tasks.length == 0) {
          /* There are no tasks left in the taskhopper, so we can give them a nice
           * thank you message! */
          gameObjectRef.activeElement.find("ul.options").hide();
          var out = $("<p>It looks like we haven't got any tasks left! All is now right with the world. Pat yourself on the back.</p>");
          out.appendTo(gameObjectRef.activeElement);
        } else {
          /* If there are tasks in the array, bind the first task to the document. */
          var task = tasks[0];
          
          /* Check to see if we have all the minimal data needed to carry out a task.
           * If not, send the user an error and try another task. */
          if (task == null || !(task instanceof Object) || task.taskType == null
              || task.taskType == "" || task.brokenValue == null
              || task.brokenValue.value == null || task.brokenValue.value == ""
              || task.id == null) {
            gameObjectRef.markError("Sorry, there has been a problem loading the task.");
          }

          /* We set the currentTaskId of the object to the ID returned by the
           * API. This is important as we use it later for constructing the URL
           * we submit back to. */
          gameObjectRef.currentTaskId = task.id;

          var out = gameObjectRef.activeElement.find(".game").first();
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
          gameObjectRef.activeElement.find("ul.options").fadeIn(400);
          out.insertBefore(gameObjectRef.activeElement.find("ul.options"));
        }
      },

      /* If there is an error, handle it with an error message, then try loading a task again. */
      error: function(data) {
        gameObjectRef.markError("");
      }
    });
  }
  return this;
} 
