defmodule Counter do
  use GenServer

  def inc(counter), do: GenServer.cast(counter, :inc)
  def dec(counter), do: GenServer.cast(counter, :dec)

  def value(counter, timeout \\ 5000) do
    GenServer.call(counter, :val, timeout)
  end

  def start_link(initial_value \\ 0) do
    GenServer.start_link(__MODULE__, [initial_value], name: __MODULE__)
  end

  def init([initial_value]) do
    {:ok, initial_value}
  end

  def handle_cast(:inc, val) do
    {:noreply, val + 1}
  end

  def handle_cast(:dec, val) do
   {:noreply, val - 1}
  end

  def handle_call(:val, _from, val) do
    {:noreply, val, val}
  end
end
