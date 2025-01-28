/**
 * DIALOG COMPONENT IS NOT NEEDED. FIND A WAY TO DIRECTLY ADD IT TO THE SIDEBAR. T
 */

import { Widget } from "@lumino/widgets";

export default class DialogBodyWidget extends Widget {
    constructor() {
      super();
      this.node.innerHTML = `
        <div>
          <input type="text" placeholder="Enter something" class="input-field" />
          <p style="color: red; display: none;" class="error-message">
            Please enter some data before saving.
          </p>
        </div>
      `;
    }
  
    // grabbing user input
    getValue(): string {
      const inputField = this.node.querySelector('.input-field') as HTMLInputElement;
      return inputField?.value ?? '';
    }

    showError(): void {
      const errorMessage = this.node.querySelector('.error-message') as HTMLParagraphElement;
      if (errorMessage) {
        errorMessage.style.display = 'block';
      }
    }
}

