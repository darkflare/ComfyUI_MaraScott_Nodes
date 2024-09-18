import { app } from "../../scripts/app.js";
import { ComfyWidgets } from "../../scripts/widgets.js";

// Displays input text on a node
app.registerExtension({
    name: "ComfyUI.MaraScott.DisplayInfo_v2",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "MaraScottDisplayInfo_v2") {
            function populate(text) {
                // Clear existing widgets if any
                if (this.widgets) {
                    for (let i = 1; i < this.widgets.length; i++) {
                        this.widgets[i].onRemove?.();
                    }
                    this.widgets.length = 0; // Reset the widgets array
                }

                // Process and display new text
                const v = [...text];
                if (!v[0]) {
                    v.shift(); // Remove first item if empty
                }
                for (const list of v) {
                    const w = ComfyWidgets["STRING"](this, "text", ["STRING", { multiline: true }], app).widget;
                    w.inputEl.readOnly = true; // Make it read-only
                    w.inputEl.style.opacity = 0.6;
                    w.value = list;
                }

                // Adjust size after adding widgets
                requestAnimationFrame(() => {
                    const sz = this.computeSize();
                    if (sz[0] < this.size[0]) {
                        sz[0] = this.size[0];
                    }
                    if (sz[1] < this.size[1]) {
                        sz[1] = this.size[1];
                    }
                    this.onResize?.(sz);
                    app.graph.setDirtyCanvas(true, false);
                });
            }

            // When the node is executed we will be sent the input text, display this in the widget
            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function (message) {
                onExecuted?.apply(this, arguments);
                populate.call(this, message.text);
            };

            // When the node is configured, display the existing value
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function () {
                onConfigure?.apply(this, arguments);
                if (this.widgets_values?.length) {
                    populate.call(this, this.widgets_values);
                }
            };

            // Handle node movement to make sure widgets stay in place
            const onNodeMoved = nodeType.prototype.onNodeMoved;
            nodeType.prototype.onNodeMoved = function () {
                onNodeMoved?.apply(this, arguments);
                // Force an update to the canvas and widgets position when moved
                this.onResize?.(this.size);
                app.graph.setDirtyCanvas(true, false);
            };

            // Ensure proper widget updates on resize or movement
            const onResize = nodeType.prototype.onResize;
            nodeType.prototype.onResize = function (size) {
                onResize?.apply(this, arguments);
                // Ensure the widgets are resized/moved appropriately
                const sz = this.computeSize();
                if (sz[0] < size[0]) sz[0] = size[0];
                if (sz[1] < size[1]) sz[1] = size[1];
                this.onResize?.(sz);
                app.graph.setDirtyCanvas(true, false);
            };
        }
    },
});
