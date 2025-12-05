/**
 *------
 * BGA framework: © Gregory Isabelli <gisabelli@boardgamearena.com> & Emmanuel Colin <ecolin@boardgamearena.com>
 * patchwork implementation : © Alena Laskavaia <laskava@gmail.com>
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * patchwork.js
 *
 * patchwork user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */
/// <reference path="./bga-framework.d.ts" />
const CELL_WIDTH = 42;

class PatchManager {
  constructor(game) {
    console.log("patch manager constructor");
  }

  // on click hooks
  onClickPatch(event) {
    console.log("onClickPatch", event);
    event.preventDefault();
    var id = event.currentTarget.id;
    if (id == null) return;
    if (!this.beginPickPatch(id)) return;
    gameui.onUpdateActionButtons_client_PickPatch(
      gameui.gamedatas.gamestate.args
    );
  }

  onClickPatchControl(event) {
    event.preventDefault();
    //if (!gameui.onClickSanity(event, false)) return;
    this.triggerControl(event.currentTarget.id);
  }

  onSquare(event) {
    console.log(
      "onSquare",
      event,
      gameui.isCurrentPlayerActive(),
      gameui.isPracticeMode()
    );
    event.preventDefault();
    var id = event.currentTarget.id;
    if (!id) return;
    if (!gameui.isCurrentPlayerActive() && !gameui.isPracticeMode()) return;
    //		if (!gameui.isActiveSlot(id)) {
    //			if (!this.practiceMode)
    //				gameui.showError(_('Illegal patch location'));
    //		}
    const dropNode = this.getDropTarget(id);
    if (dropNode == null) return;
    if (dropNode == gameui.clientStateArgs.dropTarget) {
      // pick up the piece to move again
      this.beginPickPatch(this.selectedNode);
      this.selectPickPatchSquare(dropNode);
      return;
    }
    this.selectPickPatchSquare(dropNode);
    this.endPickPatch();
  }

  applyRotate(targetNode, dir) {
    if (gameui.clientStateArgs.rotateY === undefined) {
      gameui.clientStateArgs.rotateY = 0;
      gameui.clientStateArgs.rotateZ = 0;
    }
    gameui.clientStateArgs.rotateZ = this.normalizedRotateAngle(
      gameui.clientStateArgs.rotateZ
    );
    gameui.clientStateArgs.rotateY = this.normalizedRotateAngle(
      gameui.clientStateArgs.rotateY
    );
    if (!targetNode) return;

    if (dir) {
      let prevz = gameui.clientStateArgs.rotateZ - 90 * dir;
      $(targetNode).style.transition = "none";
      $(targetNode).style.transform =
        "rotateY(" +
        gameui.clientStateArgs.rotateY +
        "deg) rotateZ(" +
        prevz +
        "deg)";
      $(targetNode).offsetHeight;
      $(targetNode).style.removeProperty("transition");
      $(targetNode).offsetHeight;
    }

    var state = this.getRotateState();
    gameui.changeTokenStateTo(targetNode, state);
    $(targetNode).style.removeProperty("transform");

    //$(targetNode).style.transform = "rotateY(" + gameui.clientStateArgs.rotateY + "deg) rotateZ(" + gameui.clientStateArgs.rotateZ + "deg)";
  }

  triggerControl(controlId) {
    console.log("trigger " + controlId);
    const targetNode = this.mobileNode;
    if (!this.mobileNode) {
      gameui.showError(_("Nothing is selected"));
      return;
    }
    if (controlId.startsWith("done_control")) {
      gameui.onDone();
      return;
    }
    if (controlId.startsWith("cancel_control")) {
      gameui.onCancel();
      return;
    }
    var dir = gameui.clientStateArgs.rotateY ? -1 : 1;
    var dirz = 0;
    if (controlId.startsWith("rotate_control")) {
      gameui.clientStateArgs.rotateZ =
        gameui.clientStateArgs.rotateZ + 90 * dir;
      dirz = dir;
    } else if (controlId.startsWith("rotateR_control")) {
      gameui.clientStateArgs.rotateZ =
        gameui.clientStateArgs.rotateZ - 90 * dir;
      dirz = -dir;
    } else if (controlId.startsWith("flipH_control")) {
      gameui.clientStateArgs.rotateZ = gameui.clientStateArgs.rotateZ + 180;
    } else if (controlId.startsWith("flip_control")) {
      if (gameui.clientStateArgs.rotateY) gameui.clientStateArgs.rotateY = 0;
      else gameui.clientStateArgs.rotateY = 180;
      //console.log("rotateY "+gameui.clientStateArgs.rotateY);
    }
    if (targetNode) this.applyRotate(targetNode, dirz);
    //
    this.updateActiveSquares();
  }

  // utils
  setupDragAndDropSupport() {
    // empty image hack to not have native ghost image
    this.emptyimg = new Image();
    this.emptyimg.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=";
    this.gamebody = $("ebd-body");

    var pboard = $("pboard_" + gameui.player_color);
    this.createPatchControl("rotate_control", pboard, "_a");
    this.createPatchControl("flip_control", pboard, "_a");
    this.createPatchControl("done_control", pboard, "_a");
    this.createPatchControl("cancel_control", pboard, "_a");

    const patchQuery = document.querySelectorAll(".patch");
    for (const item of patchQuery) {
      this.addDragListeners(item, false);
      item.addEventListener(
        "click",
        (event) => this.onClickPatch(event),
        false
      );
    }

    document
      .querySelectorAll(".tableau_" + gameui.player_color + " .square")
      .forEach((item) => {
        item.classList.add("drop-zone");
        item.addEventListener("click", (event) => this.onSquare(event), false);
      });

    document
      .querySelectorAll(".drop-zone")
      .forEach((item) => this.addDropListeners(item, false));
    this.addDropListeners($("thething"), false); // this is everyting else to show ghost image
  }

  addDragListeners(item, useCapture) {
    item.addEventListener(
      "dragstart",
      (event) => this.dragStart(event),
      useCapture
    );
    item.addEventListener(
      "dragend",
      (event) => this.dragEnd(event),
      useCapture
    );
    item.draggable = true;
    dojo.query(">*", item).forEach((node) => {
      node.draggable = false;
    });
  }

  addDropListeners(item, useCapture) {
    item.addEventListener(
      "dragover",
      (event) => this.dragOver(event),
      useCapture
    );
    item.addEventListener(
      "dragenter",
      (event) => this.dragEnter(event),
      useCapture
    );
    //item.addEventListener("dragleave", event => this.dragLeave(event), useCapture);
    item.addEventListener("drop", (event) => this.dragDrop(event), useCapture);
  }

  dragStart(event) {
    //console.log("drag started ", event.target);
    if (!event.target.id) return;
    //event.preventDefault();// does not with with prevent defaults
    //event.stopPropagation();

    var targetNode = event.target;
    event.dataTransfer.setDragImage(
      this.emptyimg,
      CELL_WIDTH / 2,
      CELL_WIDTH / 2
    ); // hide native ghost image
    this.gamebody.classList.add("pick-dragging");
    //debugger;
    var tokenId = this.beginPickPatch(targetNode);
    if (!tokenId) {
      this.gamebody.classList.remove("pick-dragging");
      event.dataTransfer.clearData();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    var shadowNode = this.createShadowNode(
      targetNode,
      "pieces_" + gameui.player_color
    );
    this.applyRotate(this.mobileNode);
    gameui.moveClass("selected", this.selectedNode);
    shadowNode.style.setProperty("pointer-events", "none");

    setTimeout(() => {
      var node = $(tokenId);
      var order = parseInt(node.getAttribute("data-order"));
      gameui.placeTokenLocal(tokenId, "market", order, { noa: true });
    }, 100);
    //console.log("drag shadow", this.mobileNode.style);
    event.dataTransfer.setData("text/plain", tokenId); // not sure if needed
    event.dataTransfer.effectAllowed = "move";
  }

  dragEnd() {
    //		console.log("drag end");
    var shadowNode = $("dragShadow");
    if (!shadowNode) return;
    if (gameui.clientStateArgs.dropTarget) {
      this.selectPickPatchSquare($(gameui.clientStateArgs.dropTarget));
    }
    gameui.removeClass("pick-dragging");
    gameui.removeClass("drag_hover");

    //shadowNode.classList.remove('invalid');
    shadowNode.style.removeProperty("pointer-events");

    if (!gameui.clientStateArgs.dropTarget) {
      // cancel
      //console.log("end cancel");
      this.cancelPickPatch();
    } else {
      var state = this.getRotateState();
      gameui.placeTokenLocal(
        gameui.clientStateArgs.token,
        gameui.clientStateArgs.dropTarget,
        state,
        { noa: true }
      );
      dojo.destroy(shadowNode);
      this.mobileNode = this.selectedNode;
      this.selectPickPatchSquare($(gameui.clientStateArgs.dropTarget));
      //console.log("end commit");
    }
    if (gameui.scrollmap) gameui.scrollmap.enableScrolling();
    this.endPickPatch();
  }

  getRotateState() {
    var state =
      this.normalizedRotateAngle(gameui.clientStateArgs.rotateZ) / 90 +
      (this.normalizedRotateAngle(gameui.clientStateArgs.rotateY) / 180) * 4;
    return state;
  }

  dragEnter(event) {
    event.preventDefault();

    var dropNode = this.getDropTarget(event.currentTarget);
    if (dropNode) event.stopPropagation();
    //if (!dropNode) dropNode = this.getDropTarget(event.target);
    //console.log("enter " + event.target.id, event.currentTarget.id, dropNode);

    if (!this.mobileNode) return; // ???
    if (event.target.id == "dragShadow") return; //ignore
    this.mobileNode.classList.remove("invalid");
    gameui.removeClass("drag_hover");

    if (dropNode == null) {
      return;
    }

    // draggig over flip controls
    if (dropNode.classList.contains("control-node")) {
      this.triggerControl(dropNode.id);
      return;
    }
    if (dropNode.id.startsWith("square")) {
      this.selectPickPatchSquare(dropNode);
    }
  }

  dragDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.mobileNode) return;
    var dropNode = this.getDropTarget(event.currentTarget);
    //console.log("drop this "+ this.selectedNode.id, dropNode,"event.target", event.target,"event.ctarget", event.currentTarget);
    //if (dropNode == null) {
    //	dropNode = $('pickTarget');
    //}
    if (dropNode == null) {
      gameui.clientStateArgs.dropTarget = null;
      return;
    }

    if (dropNode.id.startsWith("square")) {
      this.selectPickPatchSquare(dropNode);
      return;
    }
    // will be cancelled by endDrag
  }

  dragOver(event) {
    event.preventDefault();
    this.updateDragShadow(event);
  }

  dragLeave(event) {
    event.preventDefault();
    //console.log("leave "+this.id);
    const dropNode = this.getDropTarget(event.currentTarget);
    if (dropNode == null) return;

    //...
  }

  beginPickPatch(targetNode) {
    // 1) we selected original patch
    // 1.1) shadow exists
    // 2) we sekected drag shadow
    targetNode = $(targetNode);
    this.practiceMode = gameui.isPracticeMode();
    //console.log("begin "+targetNode.id);

    if (!this.practiceMode) {
      var has_error = true;
      var moves_info = gameui.gamedatas.gamestate.args.patches[targetNode.id];
      dojo.query(".head_error").forEach(dojo.destroy); // remove stack of error popups

      if (!gameui.isCurrentPlayerActive()) {
        gameui.showError(
          _("This is not your turn, turn on Practice Mode to practice placing")
        );
      } else if (!moves_info) {
        gameui.showError(_("You cannot select this patch yet"));
      } else if (!moves_info.canPay) {
        gameui.showError(_("You cannot afford this patch"));
      } else if (!moves_info.canPlace) {
        gameui.showError(
          _("You cannot place this patch on your quilt board, it would not fit")
        );
      } else {
        has_error = false;
      }
      if (has_error) return null;
    }

    gameui.clientStateArgs.token = targetNode.id;

    this.gamebody.classList.add("pick-activated");
    if (this.gamebody.classList.contains("pick-dragging") && gameui.scrollmap)
      gameui.scrollmap.disableScrolling();
    gameui.onUpdateActionButtons_client_PickPatch(
      gameui.gamedatas.gamestate.args
    );

    gameui.moveClass("selected", targetNode);
    if (targetNode != this.selectedNode) {
      if (targetNode != this.selectedNode && this.selectedNode) {
        if (this.practiceMode) {
          this.selectedNode = null;
        }
      }
      this.cancelPickPatch();
      gameui.clientStateArgs.token = targetNode.id;
      // shadow clone will apear where it will be snapped
      //console.log("creating new shadow for "+targetNode.id);

      this.selectedNode = targetNode;
      this.mobileNode = targetNode;
      gameui.clientStateArgs.rotateZ = 0;
      gameui.clientStateArgs.rotateY = 0;

      var token = targetNode.id;
      dojo.destroy(token + "_temp");

      if (!token.startsWith("patch_0")) {
        var tokenOrig = dojo.clone($(token));
        tokenOrig.id = token + "_temp";
        tokenOrig.classList.remove("active_slot");
        tokenOrig.classList.add("original");

        dojo.place(tokenOrig, "market");
        var order = parseInt(tokenOrig.getAttribute("data-order"));
        gameui.placeTokenLocal(tokenOrig.id, "market", order - 1, {
          noa: true,
        });
      }
      this.applyRotate(this.mobileNode);
      targetNode.style.transition = "none";
      gameui.attachToNewParentNoDestroy(
        targetNode,
        "pieces_" + gameui.player_color
      );
      targetNode.style.removeProperty("transition");
      gameui.moveClass("selected", targetNode);

      this.updateActiveSquares();
    }

    //console.log("selected "+gameui.clientStateArgs.token);
    return gameui.clientStateArgs.token;
  }

  endPickPatch() {
    gameui.removeClass("pick-activated");
    if (gameui.scrollmap) gameui.scrollmap.enableScrolling();
    gameui.onUpdateActionButtons_client_PickPatch(
      gameui.gamedatas.gamestate.args
    );
  }

  cancelPickPatch() {
    if (this.selectedNode) {
      this.restoreOriginalPatch(this.selectedNode.id);
    }
    this.destroy("dragShadow");
    gameui.removeClass("selected");
    gameui.removeClass("pickTarget");
    gameui.clientStateArgs.rotateY = 0;
    gameui.clientStateArgs.rotateZ = 0;
    gameui.clientStateArgs.dropTarget = null;
    gameui.clientStateArgs.token = null;
    this.selectedNode = null;
    this.mobileNode = null;
  }

  restoreOriginalPatch(targetNode) {
    targetNode = $(targetNode);
    dojo.destroy(targetNode.id + "_temp");
    if (!targetNode.id.startsWith("patch_0")) {
      //var order = parseInt(targetNode.getAttribute('data-order'));
      dojo.place(targetNode.id, "market");
      gameui.adjustScrollMap();
    } else {
      dojo.place(targetNode, "tableau_" + gameui.player_color);
      gameui.stripPosition(targetNode);
    }
  }

  selectPickPatchSquare(dropNode) {
    if (!this.mobileNode) return;
    gameui.removeClass("invalid");
    if (!gameui.isActiveSlot(dropNode.id)) {
      this.mobileNode.classList.add("invalid");
    }
    gameui.positionObjectDirectly(
      this.mobileNode,
      dropNode.style.left,
      dropNode.style.top
    );

    gameui.moveClass("pickTarget", dropNode);
    gameui.moveClass("drag_hover", dropNode);
    gameui.clientStateArgs.dropTarget = dropNode.id;
    //console.log("pos",this.mobileNode.style.left, this.mobileNode.style.top);
  }

  getDropTarget(node) {
    if (!node) return null;
    node = $(node);
    if (node.classList && node.classList.contains("drop-zone")) {
      return node;
    }
    if (node.id === "thething") return null;
    return this.getDropTarget(node.parentNode);
  }

  normalizedRotateAngle(angle) {
    if (!angle) return 0;
    angle = angle % 360;
    if (angle > 0) return angle;
    if (angle < 0) return 360 + angle;
    return 0;
  }

  updateActiveSquares() {
    document
      .querySelectorAll(".square.drop-zone")
      .forEach((item) => item.classList.remove("active_slot"));
    var curpatch = gameui.clientStateArgs.token;

    if (!curpatch) return;
    var combo =
      this.normalizedRotateAngle(gameui.clientStateArgs.rotateZ) +
      "_" +
      this.normalizedRotateAngle(gameui.clientStateArgs.rotateY);
    //console.log("updating moves for " + curpatch + " " + combo);
    var moves_info = gameui.gamedatas.gamestate.args.patches[curpatch];
    if (moves_info) {
      var moves = moves_info.moves[combo];
      if (moves) {
        for (var x of moves) {
          $(x).classList.add("active_slot");
        }
      }
    }

    const dropNode = document.querySelector(".pickTarget");
    const targetNode = this.selectedNode;

    if (dropNode && targetNode) {
      targetNode.classList.remove("invalid");
      if (!gameui.isActiveSlot(dropNode.id)) {
        targetNode.classList.add("invalid");
      }
    }
  }

  destroy(str) {
    var elem = $(str);
    if (elem) elem.remove();
  }

  updateDragShadow(coords) {
    const shadowNode = $("dragShadow");
    if (!shadowNode) {
      return;
    }

    var top, left;

    var dropNode = document.querySelector(".drag_hover");
    if (dropNode) {
      shadowNode.style.left = dropNode.style.left;
      shadowNode.style.top = dropNode.style.top;
      //console.log("pos snap", this.mobileNode.style.left, this.mobileNode.style.top);
    } else if (shadowNode.parentNode) {
      var rectM = shadowNode.parentNode.getBoundingClientRect();
      left = coords.clientX - rectM.x - CELL_WIDTH / 2;
      top = coords.clientY - rectM.y - CELL_WIDTH / 2;
      shadowNode.style.left = left + "px";
      shadowNode.style.top = top + "px";

      //console.log("pos free", shadowNode.style.left, shadowNode.style.top, coords);
    }
  }

  createShadowNode(targetNode, parent) {
    this.mobileNodeParent = $(parent);
    this.destroy("dragShadow");
    var rectT = targetNode.getBoundingClientRect();
    var rectM = this.mobileNodeParent.getBoundingClientRect();
    var x = rectT.x - rectM.x; //x position within the element.
    var y = rectT.y - rectM.y; //y position within the element.
    //		console.log("dist "+y,rectT, rectM);

    var shadowNode = (this.mobileNode = targetNode.cloneNode(true));
    shadowNode.id = "dragShadow";
    shadowNode.style.transition = "none";

    //var shadowNode = this.mobileNode = targetNode;
    dojo.setAttr(shadowNode, "data-from", targetNode.id);

    shadowNode.classList.remove("active_slot", "original");
    shadowNode.classList.add("drag-shadow");
    gameui.stripPosition(shadowNode);
    shadowNode.style.removeProperty("transform");

    //gameui.attachToNewParentNoDestroy(shadowNode,this.mobileNodeParent);
    shadowNode.style.position = "absolute";

    this.mobileNodeParent.appendChild(shadowNode);
    shadowNode.style.left = x + "px";
    shadowNode.style.top = y + "px";
    shadowNode.style.removeProperty("transition");

    //this.addDragListeners(shadowNode, false);
    //shadowNode.addEventListener("click", event => this.onClickPatch(event), false)

    return shadowNode;
  }

  createPatchControl(id, targetNode, postfix) {
    if (!postfix) postfix = "";
    var nid = id + postfix;
    gameui.createToken(nid, null, targetNode, (event) =>
      this.onClickPatchControl(event)
    );
    gameui.updateTooltip(nid);

    return $(nid);
  }
}

define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
  //"ebg/scrollmap",

  g_gamethemeurl + "/modules/sharedparent.js", // custom module
  g_gamethemeurl + "/modules/extscrollmap.js",
], function (dojo, declare) {
  /**  @type {GameGui} */
  const mygame = {
    constructor: function () {
      this.pm = new PatchManager(this);
    },
    // setup hooks
    setup: function (gamedatas) {
      console.log("Starting game setup", gamedatas);
      this.onScreenWidthChange();
      var html = document.querySelector("html");
      if (gamedatas.variants["theme_variant"] == 0) {
        html.classList.add("americana");
        $("scoreboard_wrapper").classList.add("scoreboard_3");
      } else if (gamedatas.variants["theme_variant"] == 1) {
        html.classList.add("pworiginal");
        $("scoreboard_wrapper").classList.add("scoreboard_1");
      } else if (gamedatas.variants["theme_variant"] == 2) {
        html.classList.add("pwhalloween");
        $("scoreboard_wrapper").classList.add("scoreboard_3");
        $("scoreboard_wrapper").classList.add("scoreboard_halloween");
      } else if (gamedatas.variants["theme_variant"] == 3) {
        html.classList.add("folklore");
        $("scoreboard_wrapper").classList.add("scoreboard_1");
      } else if (gamedatas.variants["theme_variant"] == 4) {
        html.classList.add("e10");
        $("scoreboard_wrapper").classList.add("scoreboard_3");
      }
      this.inherited(arguments);

      console.log("Ending game setup");
    },

    setupScrollableMap: function () {
      // Scrollable area  for pieces
      this.scrollmap = new bgagame.extscrollmap();
      // Make map scrollable
      this.scrollmap.create(
        $("map_container"),
        $("map_scrollable"),
        $("map_surface"),
        $("market")
      );
      this.scrollmap.only_x = true;
      this.scrollmap.setupOnScreenArrows(150);
      this.scrollmap.setPos(0, 0);
      document.addEventListener("blur", (e) => {
        // Cancel my drag and drop here
        this.scrollmap.onMouseUp(e);
      });
    },
    setupToken: function (token, tokenRec) {
      if (token.startsWith("patch_0")) return;
      if (token.startsWith("patch")) {
        var mat = this.gamedatas.token_types[token];
        // add extra stuff for now
        if (mat.bcoords) {
          for (var i = 0; i < mat.bcoords.length; i++) {
            var xy = mat.bcoords[i];
            var div = dojo.create("div", { class: "pbutton" }, token);
            dojo.style(div, {
              top: xy[0] * CELL_WIDTH + "px",
              left: xy[1] * CELL_WIDTH + "px",
            });
          }
        }
        var x = 0;
        var y = 0;
        var r = 2;
        //debugger;
        if (mat.lcoords[0] !== undefined) {
          y = mat.lcoords[0];
          x = mat.lcoords[1];
          r = mat.lcoords[2];
        }
        var largecost = mat.cost > 9;
        var div = dojo.create(
          "div",
          {
            class: "sticker " + (largecost ? "cost-large" : ""),
            style: { top: y * CELL_WIDTH + "px", left: x * CELL_WIDTH + "px" },
          },
          token
        );

        dojo.create("span", { class: "cost-label", innerHTML: mat.cost }, div);
        dojo.create("span", { class: "time-label", innerHTML: mat.time }, div);
        if (r == 3) {
          dojo.addClass(div, "rotated_sticker");
        }

        //					var tokenInfo = this.getTokenDisplayInfo(token);
        //					$(token).title = this.format_string_recursive(
        //						tokenInfo.title.log,
        //						tokenInfo.title.args);

        var dx = Math.floor(Math.random() * CELL_WIDTH);
        var dy = Math.floor(Math.random() * CELL_WIDTH * (4 - mat.h));
        var rotateZ = Math.floor(Math.random() * 20 - 10);
        dojo.setAttr(token, {
          "data-order": this.getTokenState(token),
          "data-dx": dx,
          "data-dy": dy,
          "data-rz": rotateZ,
        });
      } else if (token == "token_neutral") {
        var dx = CELL_WIDTH;
        var dy = CELL_WIDTH * 2;
        var rotateZ = 0;
        dojo.setAttr(token, {
          "data-order": this.getTokenState(token),
          "data-dx": dx,
          "data-dy": dy,
          "data-rz": rotateZ,
        });
      }
    },
    adjustScrollMap: function (duration) {
      // we need to move market cursor to center on 3 pieces to select
      if (!$("thething")) return;
      var container = $("market").parentNode;
      if (!container && !this.scrollmap) return;
      var width = container.offsetWidth;
      $("thething").style.removeProperty("height");
      var height = container.offsetHeight;

      var pawnPos = parseInt(gameui.getTokenState("token_neutral"));
      var TOTAL = 34;
      var off = 0; // TOTAL - pawnPos;

      var patchList = Array.from(document.querySelectorAll("#market > *")).sort(
        function (a, b) {
          var aLeft = (off + parseInt(a.getAttribute("data-order"))) % TOTAL;
          var bLeft = (off + parseInt(b.getAttribute("data-order"))) % TOTAL;
          return aLeft - bLeft;
        }
      );

      if (this.isCircleMarket()) {
        var count = patchList.length;

        var perh = height / (CELL_WIDTH * 4) - 2;
        var perw = width / (CELL_WIDTH * 5);
        if (dojo.hasClass($("thething"), "layout-s")) {
          if (perw * 2 + perh < count) {
            height = parseInt(count - perw * 2) * 4 * CELL_WIDTH;
          }
        } else {
          if (perw * 2 + perh * 2 < count) {
            height = (parseInt(count - perw * 2) * 4 * CELL_WIDTH) / 2;
          }
        }
        if (height > container.offsetHeight) {
          $("thething").style.height = height + "px";
        } else {
          height = container.offsetHeight;
        }
        console.log("re-layout fitting in " + width + " x " + height);
      }

      var dirx = 1;
      var diry = 0;
      var opa = 1;

      for (var order = 0; order < patchList.length; order++) {
        var item = patchList[order];

        var info = gameui.getTokenDisplayInfo(item.id);
        var prevInfo = null;
        if (order > 0) {
          var previtem = patchList[order - 1];
          prevInfo = gameui.getTokenDisplayInfo(previtem.id);
          if (!prevInfo) console.error("Missing prev patch for " + order);
        }

        var tokenNode = $(info.key);
        //console.log("layout "+info.key+" "+order);
        var dx = parseInt(dojo.getAttr(tokenNode, "data-dx")) || 0;
        var dy = parseInt(dojo.getAttr(tokenNode, "data-dy")) || 0;
        var mwidth = 0;
        var mheight = 0;

        if (prevInfo) {
          var prevNode = $(prevInfo.key);

          var px = parseInt(dojo.getAttr(prevNode, "data-x")) || 0;
          var py = parseInt(dojo.getAttr(prevNode, "data-y")) || 0;
          var pw = parseInt(prevInfo.w);
          var ph = parseInt(prevInfo.h);
          //console.log(tokenNode.id + " order " + order + " prevx=" + px + " w=" + prevInfo.w);
          if (this.isCircleMarket()) {
            // circle (squarish)
            if (dirx < 0) pw = info.w;
            if (diry < 0) ph = info.h;

            var mwidth = px + dirx * (pw * CELL_WIDTH + CELL_WIDTH);
            var mheight = py + diry * (ph * CELL_WIDTH + CELL_WIDTH * (3 / 4));

            if (dirx == 1 && mwidth + CELL_WIDTH * info.w > width) {
              dirx = 0;
              diry = 1;
              mwidth = width - CELL_WIDTH * 5;
              mheight = 5 * CELL_WIDTH;
            } else if (
              diry == 1 &&
              mheight + info.h * CELL_WIDTH - height > 0
            ) {
              dirx = -1;
              diry = 0;
              mwidth = px + dirx * (info.w * CELL_WIDTH + CELL_WIDTH);
              mheight = height - CELL_WIDTH * 4;
            } else if (dirx == -1 && mwidth < 0) {
              dirx = 0;
              diry = -1;
              mwidth = 0;
              mheight = py + diry * (info.h * CELL_WIDTH + CELL_WIDTH);
            } else if (diry == -1 && mheight < 4 * CELL_WIDTH) {
              dirx = 1;
              diry = 0;
              mwidth = px + dirx * (pw * CELL_WIDTH + CELL_WIDTH);
              mheight = 0;
              opa = 0.1;
            }
            if (diry != 0) dy = 0;
            if (dirx != 0) dx = 0;
          } else {
            var mwidth = px + pw * CELL_WIDTH + CELL_WIDTH;
            var mheight = 0;
            if (item.id != "token_neutral") dx = 0;
          }
        }
        tokenNode.style.left = mwidth + dx + "px";
        tokenNode.style.top = mheight + dy + "px";
        var rotateZ = parseInt(dojo.getAttr(tokenNode, "data-rz"));
        if (rotateZ) {
          var rule = "rotateY(0deg) rotateZ(" + rotateZ + "deg)";
          tokenNode.style.transform = rule;
        }
        if (opa != 1) tokenNode.style.opacity = opa;
        else tokenNode.style.removeProperty("opacity");
        dojo.setAttr(tokenNode, "data-x", mwidth);
        dojo.setAttr(tokenNode, "data-y", mheight);
      }

      if (this.scrollmap) {
        var mwidth = CELL_WIDTH * 4 * pawnPos;

        var sect = CELL_WIDTH * 5 * 3;
        var half = (width - sect) / 2;

        if (half <= 0) {
          this.scrollmap.setPos(-mwidth, 0);
        } else {
          //scroll map to 0,0
          this.scrollmap.setPos(0, 0);
        }
      }
    },
    updateDisplayInfo: function (tokenInfo) {
      // override to generated tooltips
      if (tokenInfo.key.startsWith("patch")) {
        if (tokenInfo.key.startsWith("patch_0")) {
          //tokenInfo.title = _("Bonus Patch");
          tokenInfo.tooltip = _(
            "If you reach the space with special patch (and it is still available) place it on your quilt board immediately. The special patches are the only way to 'patch' single spaces of your quilt board."
          );
        } else
          tokenInfo.title = {
            log: _(
              "Buttons Cost: ${cost} Time Cost: ${time} Income: ${income}"
            ),
            args: {
              cost: tokenInfo.cost,
              time: tokenInfo.time,
              income: tokenInfo.income,
            },
          };
      } else if (tokenInfo.key.startsWith("timetracker")) {
        tokenInfo.name = _("Time Track");
        tokenInfo.tooltip = "";
        if (tokenInfo.patch) {
          var tokenNode = $(tokenInfo.key);
          tokenInfo.name = _("Time Track - Special Patch spot");
          if (tokenNode && tokenNode.querySelector(".patch") == null) {
            tokenInfo.tooltip = _(
              "Place for special patch, if this see this - patch is gone"
            );
          }
        }
        if (tokenInfo.income) {
          var tokenNode = $(tokenInfo.key);
          tokenInfo.tooltip = _(
            "You receive a number of buttons according to the patches on your quilt board"
          );
          tokenInfo.name = _("Time Track - Button Income");
        }
        var distance = this.getTrackerDistance(tokenInfo.key);
        if (tokenInfo.tooltip) tokenInfo.tooltip += "<p>";
        if (distance < 0) distance = _("Behind");
        tokenInfo.tooltip += _("Distance:") + " " + distance;
      }
    },
    setupGameTokens: function () {
      if (this.isCircleMarket()) {
        dojo.place("market", "circle_market");
      } else {
        this.setupScrollableMap();
      }
      this.setupPreference();
      //this.updateCountersSafe(this.gamedatas.counters);
      //this.updateMyCountersAll();
      for (var token in this.gamedatas.tokens) {
        var tokenInfo = this.gamedatas.tokens[token];
        var location = tokenInfo.location;
        if (!$(location) && this.gamedatas.tokens[location]) {
          this.placeTokenWithTips(location);
        }
        this.placeTokenWithTips(token);
      }

      for (var token in this.gamedatas.tokens) {
        var tokenInfo = this.gamedatas.tokens[token];
        this.setupToken(token, tokenInfo);
      }
      this.updateCountersSafe(this.gamedatas.counters);
      dojo.query(".mini_counter").forEach((node) => {
        this.updateTooltip(node.id, node.parentNode);
      });

      this.pm.setupDragAndDropSupport();

      this.connectClass("timetracker", "onclick", "onTimeTracker");
      dojo.query(".timetracker").forEach((node) => {
        this.updateTooltip(node.id);
      });
      //this.connectClass('token_neutral', 'onclick', 'onZoomPlus');
      this.notif_eofnet();

      // DEBUG BUTTON
      var parent = this.queryFirst(".debug_section");
      if (parent) {
        var butt = dojo.create(
          "a",
          { class: "bgabutton bgabutton_gray", innerHTML: "Reload CSS" },
          parent
        );
        dojo.connect(butt, "onclick", () => reloadCss());
      }

      console.log("enging token setup");
    },
    updateMyCountersAll: function () {},

    setupPlayer: function (playerId, playerInfo, gamedatas) {
      // does nothing here, override
      console.log("player info " + playerId, playerInfo);
      // move miniboards to the right
      var playerBoardDiv = dojo.byId("player_board_" + playerId);
      var color = gamedatas.players[playerId].color;
      dojo.place("miniboard_" + color, playerBoardDiv);
    },

    /** @Override */
    addMoveToLog: function (log_id, move_id) {
      this.inherited(arguments);
      var lognode = $("log_" + log_id);
      //lognode.setAttribute('data-move-id', move_id);

      var prevmove = document.querySelector('[data-move-id="' + move_id + '"]');
      if (!prevmove) {
        tsnode = document.createElement("div");
        tsnode.classList.add("movestamp");
        tsnode.innerHTML = _("Move #") + move_id;
        lognode.appendChild(tsnode);

        tsnode.setAttribute("data-move-id", move_id);
      }
    },

    /** @Override */
    format_string_recursive: function (log, args) {
      try {
        //console.trace("format_string_recursive(" + log + ")", args);
        if (args.log_others !== undefined && this.player_id != args.player_id) {
          log = args.log_others;
        }

        if (log && args && !args.processed) {
          args.processed = true;

          if (args.you) args.you = this.divYou(); // will replace ${you} with colored version
          args.You = this.divYou(); // will replace ${You} with colored version

          var keys = [
            "token_name",
            "token_divs",
            "token_names",
            "token_div",
            "token_div_count",
          ];
          for (var i in keys) {
            var key = keys[i];
            // console.log("checking " + key + " for " + log);
            if (args[key] === undefined) continue;

            if (key == "token_divs") {
              var list = args[key].split(",");
              var res = "";
              for (var l = 0; l < list.length; l++) {
                res += this.getTokenDivForLogValue("token_div", list[l]);
              }
              res = res.trim();
              if (res) args[key] = res;
              continue;
            }
            if (key == "token_names") {
              var list = args[key].split(",");
              var res = "";
              for (var l = 0; l < list.length; l++) {
                var name = this.getTokenDivForLogValue("token_name", list[l]);
                res += name + " ";
              }
              res = res.trim();
              if (res) args[key] = res;
              continue;
            }
            if (typeof args[key] == "string") {
              if (this.getTranslatable(key, args) != -1) {
                continue;
              }
            }
            var res = this.getTokenDivForLogValue(key, args[key]);
            if (res) args[key] = res;
          }
        }
      } catch (e) {
        console.error(log, args, "Exception thrown", e.stack);
      }
      return this.inherited(arguments);
    },

    getTokenDivForLogValue: function (key, value) {
      // ... implement whatever html you want here
      //debugger;
      var token_id = value;
      if (token_id == null) {
        return "? " + key;
      }
      if (key == "token_div_count") {
        var node = this.divInlineTokenNode(value.args.token_div);
        node.innerHTML = value.args.mod;
        return node.outerHTML;
      }
      if (key == "token_div") {
        var node = this.divInlineTokenNode(value, true);
        return node.outerHTML;
      }
      if (key.endsWith("name")) {
        var name = this.getTokenName(token_id);
        var div = "<span>'" + name + "'</span>";
        return div;
      }
      return this.divInlineToken(token_id);
    },
    isPracticeMode: function () {
      return dojo.hasClass("ebd-body", "practice_mode");
    },

    isCircleMarket: function () {
      return gameui.prefs[100].value == 1;
    },

    // state hooks
    onEnteringState: function (stateName, args) {
      this.inherited(arguments);
    },

    onLeavingState: function (stateName) {
      this.inherited(arguments);
      if (!this.on_client_state) {
        dojo.query(".original").forEach((node) => {
          if (node.id.endsWith("_temp")) {
            dojo.destroy(node);
          }
        });
      }

      this.removeClass("cannot_use");
      this.removeClass("active_slot");
      this.removeClass("practice_mode");
      $("button_undo")?.remove();
    },

    onUpdateActionButtons: function (stateName, args) {
      this.inherited(arguments);
    },
    onUpdateActionButtons_common: function (stateName, args, ret) {
      if (stateName == "playerTurn") {
        gameui.addImageActionButton(
          "practice",
          _("Practice Mode"),
          () => {
            $("ebd-body").classList.add("practice_mode");
            this.onUpdateActionButtons_client_PickPatch(args);
          },
          undefined,
          _("In this mode you can place any patches to practice fitting")
        );
      }
    },

    onUpdateActionButtons_playerTurn: function (args) {
      this.clientStateArgs.action = "place";
      var canBuy = Object.keys(args.patches);
      canBuy.forEach((id) => {
        var canUse = args.patches[id].canUse;
        dojo.addClass(id, "active_slot");
        if (canUse == false) dojo.addClass(id, "cannot_use");
      });

      var pickcolor = "blue";
      if (!args.canPatch) pickcolor = "red";
      gameui.addImageActionButton(
        "b",
        _("Pick Patch"),
        () => {
          if (args.canPatch) this.setClientStateAction("client_PickPatch");
          else this.showError(_("No legal moves"));
        },
        pickcolor
      );
      gameui.addImageActionButton(
        "a",
        _("Advance") + " " + this.createDiv("pbutton") + " x " + args.advance,
        () => {
          gameui.ajaxClientStateAction("advance");
        },
        "blue",
        _("Pay time to receive buttons")
      );
      this.addUndoButton();
    },

    onUpdateActionButtons_playerPatchOne: function (args) {
      this.clientStateArgs.action = "placeSpecial";
      dojo.addClass(args.patchone, "active_slot");
      this.pm.dragEnd();
      this.pm.beginPickPatch(args.patchone);
      if (gameui.scrollmap) gameui.scrollmap.enableScrolling();
      this.onUpdateActionButtons_client_PickPatch(args);
    },

    onUpdateActionButtons_client_PickPatch: function (args) {
      //console.log('Calling  onUpdateActionButtons_client_PickPatch', args);
      dojo.empty("generalactions");
      dojo.query(".done_control,.control-node").removeClass("active_slot");

      var canBuy = Object.keys(args.patches);
      canBuy.forEach((id) => {
        var canUse = args.patches[id].canUse;
        if (canUse == false) dojo.addClass(id, "cannot_use");
        else dojo.addClass(id, "active_slot");
      });

      var sel = document.querySelector(".selected");
      var pick = document.querySelector(".pickTarget");
      var controls = false;
      if (pick) {
        if (this.isPracticeMode())
          this.setDescriptionOnMyTurn(_("Press Cancel to exit practice mode"));
        else
          this.setDescriptionOnMyTurn(
            _("Press Confirm when ready or Cancel to start over")
          );
        //this.removeClass('active_slot');
        controls = true;
      } else if (sel) {
        if (sel.id.startsWith("patch_0"))
          this.setDescriptionOnMyTurn(
            _("Place the BONUS single patch on a quilt board")
          );
        else {
          this.setDescriptionOnMyTurn(
            _("Place the patch on a quilt board. You can drag and drop")
          );
          controls = true;
        }
        this.pm.updateActiveSquares();
      } else {
        this.setDescriptionOnMyTurn(
          _("Select a patch, then place it. You can drag and drop")
        );
      }
      if (this.isPracticeMode()) {
        this.setMainTitle(_("PRACTICE MODE:"), "before");
        dojo.query(".market .patch").addClass("active_slot");
      }

      if (controls) {
        gameui.addImageActionButton(
          "rotate_control_b",
          this.createDiv("rotate-image control-image"),
          (event) => this.pm.onClickPatchControl(event)
        );
        gameui.addImageActionButton(
          "rotateR_control_b",
          this.createDiv("rotate-image control-image flip-v"),
          (event) => this.pm.onClickPatchControl(event)
        );
        gameui.addImageActionButton(
          "flip_control_b",
          this.createDiv("mirror-image control-image"),
          (event) => this.pm.onClickPatchControl(event)
        );
        //gameui.addImageActionButton('flipH_control_b', this.createDiv('mirror-image control-image rotate-right'),
        //     (event) => this.pm.onClickPatchControl(event));
        //drop-zone
        document
          .querySelectorAll(".bgaimagebutton .control-image")
          .forEach((item) => {
            item.classList.add("drop-zone", "control-node");
            this.pm.addDropListeners(item, false);
          });
      }

      if (pick && !this.isPracticeMode()) {
        dojo
          .query(".done_control,.cancel_control,.control-node")
          .addClass("active_slot");
        this.addDoneButton(_("Confirm"), "onDone");
      }
      this.addCancelButton();
      this.addUndoButton();
    },

    // debug state
    onUpdateActionButtons_playerGameEnd: function (args) {
      gameui.addActionButton("b", _("End"), () =>
        gameui.ajaxClientStateAction("endGame")
      );
    },

    // UTILS

    cancelLocalStateEffects: function () {
      this.pm.cancelPickPatch();
      this.pm.endPickPatch();
      this.inherited(arguments);
    },
    ajaxActionResultCallback: function (action, args, result) {
      this.inherited(arguments);
      if (action == "place" || action == "placeSpecial")
        this.pm.cancelPickPatch();
    },
    onPlaceToken: function (tokenId) {
      // updating counters
      var token = $(tokenId);
      if (!token) return; // destroyed
      var parent = token.parentNode;
      if (tokenId.startsWith("timemarker_")) {
        var newPos = 53 - getIntPart(parent.id, 1);
        var counter = $("time_" + getPart(tokenId, 1) + "_counter");
        counter.innerHTML = newPos;
      }
      if (tokenId.startsWith("pbutton")) {
        for (var player_id in this.gamedatas.players) {
          var playerInfo = this.gamedatas.players[player_id];
          var c = playerInfo.color;
          var size = $("buttons_" + c).children.length;
          var counter = $("buttons_" + c + "_counter");
          counter.innerHTML = size;
        }
      }
      dojo.query(".timetracker").forEach((node) => {
        this.updateTooltip(node.id);
      });
    },
    onDone: function () {
      var token = gameui.clientStateArgs.token;
      var id = gameui.clientStateArgs.dropTarget;
      if (!gameui.isActiveSlot(id)) {
        if (!this.practiceMode) gameui.showError(_("Illegal patch location"));
        return;
      }
      dojo.destroy(token + "_temp");
      gameui.removeClass("original");
      gameui.removeClass("active_slot");
      this.pm.selectedNode = null;
      this.pm.mobileNode = null;

      gameui.clientStateArgs.rotateZ = this.pm.normalizedRotateAngle(
        gameui.clientStateArgs.rotateZ
      );
      gameui.clientStateArgs.rotateY = this.pm.normalizedRotateAngle(
        gameui.clientStateArgs.rotateY
      );
      var state = this.pm.getRotateState();
      gameui.placeTokenLocal(
        gameui.clientStateArgs.token,
        gameui.clientStateArgs.dropTarget,
        state,
        { noa: true }
      );

      this.ajaxClientStateAction();
    },

    getPlaceRedirect: function (token, tokenInfo) {
      var location = tokenInfo.location;
      var result = {
        location: location,
        inlinecoords: false,
      };

      if (location.startsWith("market")) {
        var state = parseInt(tokenInfo.state);
        result.position = "absolute";
        var tokenNode = $(token);
        if (!tokenNode) return result; // ???
        dojo.setAttr(tokenNode, "data-order", state);

        var dx = parseInt(dojo.getAttr(tokenNode, "data-dx"));
        var dy = parseInt(dojo.getAttr(tokenNode, "data-dy"));
        var rotateZ = parseInt(dojo.getAttr(tokenNode, "data-rz"));
        if (rotateZ) {
          var rule = "rotateY(0deg) rotateZ(" + rotateZ + "deg)";
          tokenNode.style.transform = rule;
        }

        var x = dojo.getAttr(tokenNode, "data-x");
        var y = dojo.getAttr(tokenNode, "data-y");
        var mwidth = 0;
        var mheight = 0;
        if (x !== undefined) {
          result.x = x;
        } else {
          result.x = dx + mwidth;
        }
        if (y !== undefined) {
          result.y = y;
        } else {
          result.y = dy + mheight;
        }

        return result;
      }
      if (
        location.startsWith("supply_buttons") ||
        location.startsWith("buttons")
      ) {
        //	debugger;
        result.inlinecoords = true;
        var cbox = dojo.contentBox(location);
        var width = cbox.w - 40;
        var height = cbox.h - 40;
        result.x = Math.floor(Math.random() * width);
        result.y = Math.floor(Math.random() * height);
        if (!$(token)) this.createToken(token, tokenInfo, location);
        //dojo.attr(token, 'data-pos', getIntPart(token, 1));
        return result;
      }
      if (location.startsWith("square")) {
        result.inlinecoords = true;

        var top = getIntPart(location, 2) * CELL_WIDTH;
        var left = getIntPart(location, 3) * CELL_WIDTH;

        result.x = left;
        result.y = top;
        result.location = "pieces_" + getPart(location, 1);
        if ($(token)) $(token).style.removeProperty("transform");
      }
      if (location.startsWith("buttons")) {
        //debugger;
      }
      if (location.startsWith("tableau") && token.startsWith("tile_special")) {
        result.location = "miniboard_" + getPart(location, 1);
      }
      return result;
    },

    // CALLBACKS

    onScreenWidthChange: function () {
      // set  size for layouts
      var gamenodeId = "thething";
      if (!$(gamenodeId)) return;
      var game_screen = dojo.marginBox(gamenodeId);
      var board_w = 9 * CELL_WIDTH;
      var game_w = game_screen.w;
      var padding = 10;
      var layout;
      var circle_padding = 0;
      if (this.isCircleMarket()) {
        circle_padding = 4 * CELL_WIDTH;
      }
      if (game_w > board_w * 3 + padding * 4 + circle_padding * 2)
        layout = "layout-l";
      else if (game_w > board_w * 2 + padding * 3 + circle_padding * 2)
        layout = "layout-m";
      else layout = "layout-s";

      dojo.removeClass(gamenodeId, "layout-m");
      dojo.removeClass(gamenodeId, "layout-l");
      dojo.removeClass(gamenodeId, "layout-s");
      dojo.addClass(gamenodeId, layout);

      this.adjustScrollMap();
      this.fixViewPort();
    },
    setupPreference: function () {
      // Extract the ID and value from the UI control
      var _this = this;

      function onchange(e) {
        var match = e.target.id.match(/^preference_[cf]ontrol_(\d+)$/);
        if (!match) {
          return;
        }
        var prefId = +match[1];
        var prefValue = +e.target.value;
        _this.prefs[prefId].value = prefValue;
        _this.onPreferenceChange(prefId, prefValue);
      }

      // Call onPreferenceChange() when any value changes

      if ($("current_player_board"))
        dojo.place("settings_extra", "current_player_board");
      else {
        var spe = document.querySelector(".player-board.spectator-mode");
        if (spe) dojo.place("settings_extra", spe);
      }
      var p = "settings-controls-container";
      for (var i = 100; i <= 102; i++) {
        var block100 = dojo.create("div", { class: "pwpref_block" }, p);
        dojo.create(
          "span",
          {
            class: "layout_market_label",
            innerHTML: _(this.prefs[i].name) + ":",
          },
          block100
        );
        var d100 = dojo.clone($("preference_control_" + i));
        d100.id = "preference_fontrol_" + i;
        dojo.place(d100, block100);
      }

      dojo.query(".preference_control").connect("onchange", onchange);
      // Call onPreferenceChange() now
      dojo
        .query("#ingame_menu_content .preference_control")
        .forEach((el) => onchange({ target: el }));

      dojo.connect($("show-settings"), "onclick", () => {
        dojo.toggleClass(
          "settings-controls-container",
          "settingsControlsHidden"
        );
      });
      this.addTooltip("show-settings", "", _("Display game prefernces"));
    },

    onPreferenceChange: function (prefId, prefValue) {
      console.log("Preference changed", prefId, prefValue);

      //$('layout_market').innerHTML=_(_this.prefs[prefId].values[_this.prefs[prefId].value].name);
    },

    fixViewPort: function () {
      if (true) return; // disable this for now
      // Remove broken "zoom" property added by BGA framework
      this.gameinterface_zoomFactor = 1;
      this.default_viewport =
        "width=" + this.interface_min_width + ",initial-scale=1.0"; // set viewport
      $("page-content").style.removeProperty("zoom");
      $("page-title").style.removeProperty("zoom");

      if (
        /Android|webOS|iPhone|iPod|iPad|BlackBerry/i.test(navigator.userAgent)
      ) {
        $("right-side-first-part").style.removeProperty("zoom");

        var viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.content = this.default_viewport;
          console.log(navigator.userAgent + " " + viewport.content);
        }
      } else {
        var screen = dojo.position("left-side");
        var zoomFactor = screen.w / this.interface_min_width;
        // only use this if you not using bga animation methods
        if (zoomFactor > 0.01 && zoomFactor < 1)
          $("page-content").style.setProperty(
            "transform",
            "scale(" + zoomFactor + ")"
          );
        else $("page-content").style.removeProperty("transform");
      }
    },

    getTrackerDistance: function (trackerId) {
      var id = trackerId;
      var tt = getPart(id, 1);
      var tm = "timemarker_" + this.player_color;
      var value = parseInt(tt) - parseInt(getPart($(tm).parentNode.id, 1));
      if (value > 0) value = "+" + value;
      return value;
    },

    onTimeTracker: function (event) {
      dojo.stopEvent(event);
      var id = event.currentTarget.id;
      var value = this.getTrackerDistance(id);
      var scoring_marker_id = "tta";
      dojo.destroy(scoring_marker_id);
      dojo.create(
        "div",
        { class: "timetrack_anim", innerHTML: value, id: scoring_marker_id },
        id
      );
      this.fadeOutAndDestroy(scoring_marker_id, 2000, 0);
    },

    // NOTIF
    setupNotifications: function () {
      this.inherited(arguments);
      dojo.subscribe("eofnet", this, "notif_eofnet");
    },

    notif_eofnet: function (notif) {
      this.adjustScrollMap();
      if (notif && notif.args.income) {
        var loc = "income_" + notif.args.player_color + "_counter";
        var counter = $(loc);
        //console.log('income counter update ' + loc, notif.args);
        if (counter) counter.innerHTML = notif.args.income;
        else console.error("cannot find player counter " + loc);
        gameui.gamedatas.counters[loc] = {
          counter_value: notif.args.income,
          counter_name: loc,
        };
        gameui.gamedatas_server.counters[loc] = {
          counter_value: notif.args.income,
          counter_name: loc,
        };
      }
    },
  };
  return declare("bgagame.patchwork", bgagame.sharedparent, mygame);
});
