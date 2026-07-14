/*
 * Please refer to https://docs.envio.dev for a thorough guide on all Envio indexer features
 */
import { indexer } from "envio";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

indexer.onBlock(
  {
    name: "TotalSupplySnapshot",
    chain: 1,
    interval: 1000,
  },
  async ({ block, context }) => {
    const latestSupply = await context.TotalSupply.get("latest");
    if (!latestSupply) return;

    context.TotalSupplySnapshot.set({
      id: `${block.chainId}_${block.number}`,
      supply: latestSupply.currentSupply,
      blockNumber: latestSupply.blockNumber,
      timestamp: latestSupply.timestamp,
    });
  }
);

indexer.onEvent(
  { contract: "ERC20", event: "Transfer" },
  async ({ event, context }) => {
  const { from, to, amount } = event.params;

  // Only track transfers to/from zero address (minting/burning)
  if (from !== ZERO_ADDRESS && to !== ZERO_ADDRESS) {
    return;
  }

  const latestSupply = await context.TotalSupply.getOrCreate({
    id: "latest",
    currentSupply: BigInt(0),
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });

  // Calculate new total supply
  const newSupply =
    latestSupply.currentSupply + (from === ZERO_ADDRESS ? amount : -amount);

  // Update the "latest" entry for future calculations
  context.TotalSupply.set({
    id: "latest",
    currentSupply: newSupply,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });
}
);
