// Custom method : being near means being within the expected variance determined by MAX_VARIANCE
import { BigNumber } from '@ethersproject/bignumber'

const MAX_VARIANCE = 1000 // 0.1 % accepted variance

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  export namespace Chai {
    interface Assertion {
      near(actual: BigNumber): void
    }
  }
}

export function near(chai: Chai.ChaiStatic): void {
  const Assertion = chai.Assertion
  Assertion.addMethod('near', function (actual: BigNumber): void {
    const expected = (this._obj as BigNumber).abs()
    const delta: BigNumber = expected.sub(actual.abs()).abs()
    this.assert(
      delta.lte(expected.div(MAX_VARIANCE)),
      'expected #{exp} to be near #{act}',
      'expected #{exp} to not be near #{act}',
      String(expected),
      String(actual)
    )
  })
}
