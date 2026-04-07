import { useFocusStore } from "@/store/focusStore.ts";

export function resetFocusStore() {
  useFocusStore.setState({
    focus: {
      section: "sidebar",
      sidebarIndex: 0,
      rowIndex: 0,
      colIndex: 0,
    },
    focusCheckpoint: null,
    shellRestorePending: false,
  });
}
