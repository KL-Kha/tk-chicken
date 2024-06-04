/** @odoo-module */
import { ormService } from "@web/core/orm_service";
import { registry } from "@web/core/registry";
import { renderToString } from "@web/core/utils/render";
import { Component, xml, onWillStart, App } from "@odoo/owl";
import { session } from '@web/session';

export class MjbInjector{
  constructor({ debug = true, version = "0.1", $ = false, lib = false , services = false}) {
    const self = this;

    self.debug = false;
    if (window.location.href.indexOf("debug=1") > -1) {
      self.debug = true;
    }

    self.disabled = false;
    if (window.location.href.indexOf("disable_mjb_injector") > -1) {
      self.disabled = true;
    }

    self.$ = $;
    self.lib = lib;
    self.version = version;
    self.className = self.constructor.name;
    self.session = odoo.session_info || false;
    self.orm = services.orm

  }

  log(msg) {
    const self = this;
    if (self.debug) {
      console.log(`[${self.className} | ${self.version}]`, msg);
    }
  }

  start() {
    const self = this;
    self.log(`start: ${self.version}`);
    if (self.disabled) {
      self.log(`Service is disabled`);
      return false;
    }
    try {
      self.asyncStart();
    } catch (e) {
      console.error(e);
    }
  }

  async initInjector() {
    const self = this;
    self.log(`Query resources`);

    await self.orm.call("mjb.injector","get_current_user_static").then(function (result) {
        self.log(`... request successful`);

        if (!odoo["_mjb"]) odoo["_mjb"] = {};

        odoo["_mjb"][self.className] = self;

        // Handle CSS
        if (
          result.css &&
          result.css.length > 5 // Make sure the content is not empty
        ) {
          self.log(`... Add CSS`);
          var style = document.createElement("style");
          style.type = "text/css";
          style.innerHTML = result.css;
          document.getElementsByTagName("head")[0].appendChild(style);
          self.log(`... ... added CSS`);
        }

//         Handle XML
//        if (result.xml && result.xml.length > 0) {
//          self.log(`... Add XML`);
//          addTemplates(result.xml);
//          result.xml.map((x) => {
//            if (x) {
//              console.log(x);
//              alert(x)
//              renderToString.app.addTemplates(result.xml);
//              self.lib.qweb.add_template(x);
//              self.log(`... ... added XML`);
//            }
//          });
//        }

        // Handle JS
        if (result.js && result.js.length > 5) {
          self.log(`... Add JS`);
          eval(result.js);
          self.log(`... ... added/eval JS`);
        }
      })
      .catch((e) => {
        self.log(`... request failed`);
        console.error(e);
      });
  }

  escapeHtml(text) {
    const self = this;
    self.log(`escapeHtml`);

    var map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return text.replace(/[&<>"']/g, function (m) {
      return map[m];
    });
  }

  displaySnippet(idx) {
    const self = this;
    self.log(`displaySnippet: ${idx}`);
    self.log(self.snippets);

    if (self.snippets[idx]) {
      self.clearSnippet();
      var snip = self.snippets[idx];
      self.log(snip);

      $(".snippet_results").append(
        `<h4 class="mjb_snippet_title">${snip["name"]} <button style="margin-left:5px;" class="mjb_snippet_use_btn btn btn-primary small">Use this snippet</button></h4>`
      );
      $(".snippet_results").append(
        `<p class="mjb_snippet_description">${snip["description"]}</p>`
      );
      $(".snippet_results").append(
        `<p class="mjb_snippet_author">By <a target="_blank" href="${
          snip["link"]
        }">${snip["author"]}</a> in ${[snip["tags"], snip["version"]].join(
          ", "
        )}</p>`
      );
      $(".snippet_results").append(`<hr />`);

      if (snip["html"].length > 0) {
        $(".snippet_results").append(
          `<p class="mjb_snippet_html">${snip["html"]}</p>`
        );
      }
      if (snip["js"].length > 0) {
        $(".snippet_results").append(
          `<h6 class="mjb_snippet_subtitle">JS</h6>`
        );
        $(".snippet_results").append(
          `<pre class="mjb_snippet_js language-js"><code class="language-js">${self.escapeHtml(
            snip["js"]
          )}</code></pre>`
        );
      }
      if (snip["xml"].length > 0) {
        $(".snippet_results").append(
          `<h6 class="mjb_snippet_subtitle">XML</h6>`
        );
        $(".snippet_results").append(
          `<pre class="mjb_snippet_xml language-xml"><code class="language-xml">${self.escapeHtml(
            snip["xml"]
          )}</code></pre>`
        );
      }
      if (snip["css"].length > 0) {
        $(".snippet_results").append(
          `<h6 class="mjb_snippet_subtitle">CSS</h6>`
        );
        $(".snippet_results").append(
          `<pre class="mjb_snippet_css language-css"><code class="language-css">${self.escapeHtml(
            snip["css"]
          )}</code></pre>`
        );
      }

      $(".mjb_snippet_use_btn").click(() => {
        if (snip["name"].length > 0) {
          $('input[name="name"]').val(snip["name"]);
        }
        if (snip["description"].length > 0) {
          $('input[name="description"]').val(snip["description"]);
        }
        if (snip["link"].length > 0) {
          $('input[name="link"]').val(snip["link"]);
        }
        if (snip["js"].length > 0) {
          $('textarea[name="js"]').val(snip["js"]);
        }
        if (snip["css"].length > 0) {
          $('textarea[name="css"]').val(snip["css"]);
        }
        if (snip["xml"].length > 0) {
          $('textarea[name="xml"]').val(snip["xml"]);
        }
      });
    } else {
      self.handleError("Snippet cannot be found");
    }
  }

  clearLogs() {
    const self = this;
    self.log("clearLogs");
    $(".snippet_search_log").children().remove();
  }

  clearSnippet() {
    const self = this;
    self.log("clearSnippet");
    $(".snippet_results").children().remove();
  }

  clear() {
    const self = this;
    self.log("clear");
    $(".snippet_search_results").find("ul").remove();
    self.snippets = [];
  }

  handleSuccess(r) {
    const self = this;
    self.log("handleSuccess");

    self.clear();
    self.snippets = r;
    self.logClient(`Received ${self.snippets.length} snippets`, "text-success");
    self.log(self.snippets);

    var list = $("<ul></ul>");
    list.css("padding-left", "15px");

    var results = self.snippets.map((s, i) => {
      list.append(
        $(
          `<li><strong><a href="javascript:;" class="mjb_injector_snippet_link" index="${i}">${s.name}</a></strong></li>`
        )
      );
    });
    $(".snippet_search_results").append(list);

    $(".mjb_injector_snippet_link").each((i) => {
      self.log(`bind link: ${i}`);
      var link = $($(".mjb_injector_snippet_link")[i]);
      link.addClass("binded");
      link.click((e) => {
        e.preventDefault();
        self.log("Click on snippet link");
        self.displaySnippet(link.attr("index"));
      });
    });
  }

  logClient(m, level) {
    const self = this;
    $(".snippet_search_log").append(`<p class="${level}">${m}</p>`);
  }

  handleError(e) {
    const self = this;
    self.log("handleError", e);
    self.logClient(e, "text-danger");
    self.clear();
  }

  handleNotEnoughChar() {
    const self = this;
    self.log("handleNotEnoughChar");
    self.clearLogs();
    self.logClient("Make sure to input at least 2 characters", "text-warning");
    self.clear();
  }

  search() {
    const self = this;
    self.log("search");
    self.clearLogs();

    var value = $(".mjb_injector_search_snippets").val();
    if (value.length > 2) {
      $.post("https://snippets.api.majorbird.com/search", {
        q: value,
      })
        .then((r) => {
          self.handleSuccess(JSON.parse(r));
        })
        .catch((e) => {
          self.handleError(e);
        });
    } else {
      self.handleNotEnoughChar();
    }
  }

  initSnippets() {
    const self = this;
    self.log(`initSnippets`);
    var fetchSnippets_interval = setInterval(() => {
      if (!(window.location.href.indexOf("mjb.injector") > -1)) {
        return false;
      }
      if ($(".mjb_injector_search_snippets").length > 0) {
        if (!$(".mjb_injector_search_snippets").hasClass("binded")) {
          $(".mjb_injector_search_snippets").addClass("binded");

          self.snippets = [];

          var timer = false;
          timer = setTimeout(() => {
            self.search();
          }, 400);

          $(".mjb_injector_search_snippets").on("input", function (e) {
            self.log("input");
            if (timer) {
              clearTimeout(timer);
            }
            timer = setTimeout(() => {
              self.search();
            }, 400);
          });
          //clearInterval(fetchSnippets_interval);
        }
      }
    }, 1000);
  }

  async asyncStart() {
    const self = this;
    self.log(`asyncStart`);
    self.initInjector();
    self.initSnippets();
  }
}


export const mjbInjector = {
    dependencies: ["orm"],
    /**
     * @param {import("@web/env").OdooEnv} env
     * @param {Partial<import("services").Services>} services
     */
    start(env, services) {
        var lib = {
        }
        let instance = new MjbInjector({
           version: "17.0.0.1",
           debug: true,
           $: $,
           lib: lib,
           services: services
         });
         instance.start();
         return instance;
    },
};

registry.category("services").add("mjbInjector", mjbInjector);


