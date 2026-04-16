using System.Diagnostics;
using System.Runtime.InteropServices;

namespace OrangeTv.Api.Platform;

/// <summary>Win32 <c>ShowWindow</c> / <c>SetForegroundWindow</c> for child streaming windows.</summary>
public sealed class WindowsChildProcessWindowOrchestrator : IChildProcessWindowOrchestrator
{
    private const int SwMinimize = 6;
    private const int SwRestore = 9;

    public Task<ChildWindowOpResult> MinimizeAsync(int processId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var hwnd = TryResolveMainWindowHandle(processId);
        if (hwnd == 0)
        {
            return Task.FromResult(new ChildWindowOpResult(false, "no-main-window"));
        }

        if (!ShowWindow(hwnd, SwMinimize))
        {
            return Task.FromResult(new ChildWindowOpResult(false, "show-window-failed"));
        }

        return Task.FromResult(new ChildWindowOpResult(true, null));
    }

    public Task<ChildWindowOpResult> ForegroundAsync(int processId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var hwnd = TryResolveMainWindowHandle(processId);
        if (hwnd == 0)
        {
            return Task.FromResult(new ChildWindowOpResult(false, "no-main-window"));
        }

        if (IsIconic(hwnd))
        {
            ShowWindow(hwnd, SwRestore);
        }

        SetForegroundWindow(hwnd);
        BringWindowToTop(hwnd);
        return Task.FromResult(new ChildWindowOpResult(true, null));
    }

    private static nint TryResolveMainWindowHandle(int processId)
    {
        try
        {
            using var p = Process.GetProcessById(processId);
            p.Refresh();
            if (p.MainWindowHandle != IntPtr.Zero)
            {
                return p.MainWindowHandle;
            }
        }
        catch (ArgumentException)
        {
            return 0;
        }
        catch (InvalidOperationException)
        {
            return 0;
        }

        return FindVisibleTopLevelWindow(processId);
    }

    private static nint FindVisibleTopLevelWindow(int processId)
    {
        nint found = 0;
        _ = EnumWindows(
            (hWnd, _) =>
            {
                GetWindowThreadProcessId(hWnd, out var pid);
                if ((int)pid != processId)
                {
                    return true;
                }

                if (!IsWindowVisible(hWnd))
                {
                    return true;
                }

                if (GetParent(hWnd) != 0)
                {
                    return true;
                }

                found = hWnd;
                return false;
            },
            0);
        return found;
    }

    private delegate bool EnumWindowsProc(nint hWnd, nint lParam);

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, nint lParam);

    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint GetWindowThreadProcessId(nint hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsWindowVisible(nint hWnd);

    [DllImport("user32.dll", ExactSpelling = true)]
    private static extern nint GetParent(nint hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool ShowWindow(nint hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool SetForegroundWindow(nint hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool BringWindowToTop(nint hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    private static extern bool IsIconic(nint hWnd);
}
