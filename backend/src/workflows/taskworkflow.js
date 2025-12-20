export const isValidTaskTransition = (from, to) => {
    const transitions = {
        TODO: ["IN_PROGRESS"],
        IN_PROGRESS: ["DONE"],
        DONE: []
    };

    return transitions[from]?.includes(to);
};
