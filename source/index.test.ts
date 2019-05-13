import * as SafetyNet from './index';

describe('SafetyNet Tests', () => {
  beforeAll(() => {
    jest.spyOn(SafetyNet, 'createNonce');
  });

  it('Should generate a nonce key', () => {
    const nonce = SafetyNet.createNonce(['some', 'additional', 'data']);
    expect.assertions(2);
    expect(typeof nonce).toBeTruthy();
    expect(SafetyNet.createNonce).toBeCalledWith([
      'some',
      'additional',
      'data',
    ]);
  });
});

// @TODO: Add more test
