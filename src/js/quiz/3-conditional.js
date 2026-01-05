/* conditional.js
   Evaluate simple `conditional.showWhen` structures.
   Supports object like { "hasCCTV": "Yes" } or combinations.
*/
(function(global){
  const Conditional = {
    isVisible(question, answers){
      if(!question.conditional || !question.conditional.showWhen) return true;
      const rule = question.conditional.showWhen;
      // support single key or multiple keys (AND semantics)
      for(const key in rule){
        const expected = rule[key];
        const actual = answers[key];
        
        if(Array.isArray(expected)){
          // expected as array means any of them
          if(!expected.includes(actual)) return false;
        } else {
          if(actual !== expected) return false;
        }
      }
      
      return true;
    }
  };

  global.Conditional = Conditional;
})(window);
