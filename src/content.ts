let BadWordsFilter = require('bad-words');

import { stemmer } from 'stemmer';


class NSFWWordsFilter {
  protected bad_words_filter = new BadWordsFilter();

  constructor() {}

  async watch() {
    let callback = (mutation_list: MutationRecord[], observer: MutationObserver): void => {
      for(let mutation of mutation_list) {
        if(mutation.type == "childList" && mutation.addedNodes.length > 0)
          this.filter(mutation.target);
      }
    }
    let observer: MutationObserver = new MutationObserver(callback);
    observer.observe(document.body, {childList: true, subtree: true, characterData: true});
  }
  async filter(root: Node = document.body) {
    let text_node_walker = this.traverse_text_nodes_under(root);
    let text_node: Node | null = text_node_walker.nextNode();
    while(text_node) {
      let next_text_node: Node | null = text_node_walker.nextNode();
      let substitute_node = document.createElement("span");
      let words = (text_node as CharacterData).data.split(/\s/);
      for(let word of words) {
        if (word.trim().length && this.bad_words_filter.isProfane(stemmer(word.toLowerCase()))) {
          substitute_node.innerHTML = substitute_node.innerHTML.concat(` <span class='nsfw'>${word}</span>`);
        } else {
          substitute_node.innerHTML = substitute_node.innerHTML.concat(` ${word} `);
        }
      }
      (text_node as CharacterData).replaceWith(substitute_node);
      text_node = next_text_node;
    }
  }

  protected traverse_text_nodes_under(root: Node) {
    let accept_node = (node: Node) => {
      return NSFWWordsFilter.is_script_node(node) || NSFWWordsFilter.is_text_node_empty(node) || NSFWWordsFilter.is_text_node_checked(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
    }
    let tree_walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {acceptNode: accept_node})
    return tree_walker;
  }

  static is_script_node(node: Node): boolean {
      return ["SCRIPT", "STYLE"].includes((node.parentElement as Node).nodeName);
  }

  static is_text_node_checked(node: Node): boolean {
    if (node.parentElement) {
      return (node.parentElement as HTMLElement).classList.contains("nsfw");
    }
    return false
  }

  static is_text_node_empty(node: Node): boolean {
    return (node as CharacterData).data.replace(/\s/g, "").length  <= 1;
  }
}

window.addEventListener("DOMContentLoaded", (event: Event) => {
  let nsfw_words_filter = new NSFWWordsFilter();
  nsfw_words_filter.filter();
  nsfw_words_filter.watch();
});
