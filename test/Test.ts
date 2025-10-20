import assert from "assert";
import { 
  TestHelpers,
  TotalSupply
} from "generated";
const { MockDb, Uni } = TestHelpers;

describe("Uni contract Transfer event tests for total supply tracking", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  it("TotalSupply is created correctly for mint event (from zero address)", async () => {
    // Creating mock for Uni contract Transfer event from zero address (minting)
    const event = Uni.Transfer.createMockEvent({
      from: "0x0000000000000000000000000000000000000000",
      to: "0x1234567890123456789012345678901234567890",
      amount: BigInt(1000000)
    });

    // Processing the event
    const mockDbUpdated = await Uni.Transfer.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualTotalSupply = mockDbUpdated.entities.TotalSupply.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedTotalSupply: TotalSupply = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      currentSupply: BigInt(1000000), // First mint, so supply equals amount
      blockNumber: BigInt(event.block.number),
      timestamp: BigInt(event.block.timestamp),
      changeAmount: BigInt(1000000),
      changeType: "mint",
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualTotalSupply, expectedTotalSupply, "Actual TotalSupply should be the same as the expectedTotalSupply");
  });

  it("TotalSupply is created correctly for burn event (to zero address)", async () => {
    // First create a mock db with existing supply
    const initialMockDb = MockDb.createMockDb();
    
    // Create initial mint event
    const mintEvent = Uni.Transfer.createMockEvent({
      from: "0x0000000000000000000000000000000000000000",
      to: "0x1234567890123456789012345678901234567890",
      amount: BigInt(1000000)
    });

    const mockDbWithSupply = await Uni.Transfer.processEvent({
      event: mintEvent,
      mockDb: initialMockDb,
    });

    // Now create burn event
    const burnEvent = Uni.Transfer.createMockEvent({
      from: "0x1234567890123456789012345678901234567890",
      to: "0x0000000000000000000000000000000000000000",
      amount: BigInt(500000)
    });

    // Processing the burn event
    const mockDbUpdated = await Uni.Transfer.processEvent({
      event: burnEvent,
      mockDb: mockDbWithSupply,
    });

    // Getting the actual entity from the mock database
    let actualTotalSupply = mockDbUpdated.entities.TotalSupply.get(
      `${burnEvent.chainId}_${burnEvent.block.number}_${burnEvent.logIndex}`
    );

    // Creating the expected entity
    const expectedTotalSupply: TotalSupply = {
      id: `${burnEvent.chainId}_${burnEvent.block.number}_${burnEvent.logIndex}`,
      currentSupply: BigInt(500000), // 1000000 - 500000 = 500000
      blockNumber: BigInt(burnEvent.block.number),
      timestamp: BigInt(burnEvent.block.timestamp),
      changeAmount: BigInt(500000),
      changeType: "burn",
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualTotalSupply, expectedTotalSupply, "Actual TotalSupply should be the same as the expectedTotalSupply");
  });
});
