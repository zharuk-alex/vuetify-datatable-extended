function sortableWatchClass(targetNode, classToWatch) {
  let lastClassState = targetNode.classList.contains(classToWatch);
  const observer = new MutationObserver((mutationsList) => {
    for (let i = 0; i < mutationsList.length; i++) {
      const mutation = mutationsList[i];
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName === 'class'
      ) {
        const currentClassState =
          mutation.target.classList.contains(classToWatch);
        if (lastClassState !== currentClassState) {
          lastClassState = currentClassState;
          if (!currentClassState) {
            mutation.target.classList.add('sortHandle');
          }
        }
      }
    }
  });
  observer.observe(targetNode, { attributes: true });
}

function bodyObserver(targetNode) {
  return new Promise(resolve => {
    const observer = new MutationObserver(function (mutations) {
      let isBody = mutations.some(
        (mutation) => mutation.target.localName == 'tbody'
      );

      if (isBody) {
        observer.disconnect();
        resolve(isBody);
      }

    });

    observer.observe(targetNode, { childList: true, subtree: true });
  });
}

export { sortableWatchClass, bodyObserver };